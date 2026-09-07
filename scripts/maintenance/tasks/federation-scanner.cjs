/**
 * Federation Scanner — Maintenance Task
 *
 * Discovers football teams from Baltic federation websites, league pages,
 * and government registries. Compares discoveries against the existing
 * team registry and flags new/unmatched teams for review.
 *
 * Data sources per country:
 *   EE — jalgpall.ee league tables (Premium Liiga, Esiliiga, youth leagues)
 *   LV — data.gov.lv NGO registry CSV (NACE 93.1 / "futbols") + Wikipedia
 *   LT — toplyga.lt A Lyga team listings + Wikipedia
 *
 * Output: data/federation-discoveries.json
 *   Each entry has status: "pending" (needs review) or "approved" (ready to merge).
 *   Approved items are ingested by team-registry task on the next run.
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const name = 'federation-scanner'

/** Normalize team name for fuzzy matching (accent-strip + lowercase + strip prefixes) */
function normalize(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(fk|fc|fs|jk|jfc|mtü|vši|as)\b/gi, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Check if a discovered team name matches any existing team (name or aliases) */
function findMatch(discoveredName, existingTeams) {
  const norm = normalize(discoveredName)
  for (const team of existingTeams) {
    if (normalize(team.name) === norm) return team
    for (const alias of (team.aliases || [])) {
      if (normalize(alias) === norm) return team
    }
    // Substring match for short names (e.g. "Levadia" in "Tallinna FCI Levadia")
    if (norm.length >= 5 && normalize(team.name).includes(norm)) return team
    if (norm.length >= 5 && team.abbreviation && normalize(team.abbreviation) === norm) return team
  }
  return null
}

/** Fetch a URL and return the body as string */
function fetchUrl(url, timeout = 15000, redirectsLeft = 3) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, { headers: { 'User-Agent': 'Golazo/1.0 (naurolabs.com)' }, timeout }, (res) => {
      // Follow redirects (up to 3)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        if (redirectsLeft === 0) return reject(new Error(`Too many redirects for ${url}`))
        return fetchUrl(new URL(res.headers.location, url).href, timeout, redirectsLeft - 1).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('error', reject)
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout fetching ${url}`)) })
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ═══════════════════════════════════════════════════════════
//  Estonia — jalgpall.ee league page scraping
// ═══════════════════════════════════════════════════════════

async function scanEstonia(config, existingTeams) {
  const discoveries = []
  const enrichments = []
  const errors = []
  const year = new Date().getFullYear()

  for (const league of config.federationSources.EE) {
    console.log(`│    EE: Scanning ${league.name} (ID: ${league.id})...`)
    try {
      const url = league.url || `https://jalgpall.ee/voistlused/${league.id}/${league.slug || 'premium-liiga'}`
      const html = await fetchUrl(url)

      // Extract team names and logo URLs from league table
      // Pattern: <a href="/voistlused/{leagueId}/team/{teamId}?season=YYYY">Team Name</a>
      const teamPattern = /\/voistlused\/\d+\/team\/(\d+)\?season=\d+[^>]*>([^<]+)</g
      const logoPattern = /\/images\/(?:logos|clubs|teams)\/([A-F0-9]+)/gi
      const seen = new Set()

      let match
      while ((match = teamPattern.exec(html)) !== null) {
        const teamId = match[1]
        const teamName = match[2].trim()
        if (seen.has(teamId) || !teamName) continue
        seen.add(teamId)

        // Try to find logo URL near this team reference
        const teamSection = html.substring(Math.max(0, match.index - 500), match.index + 500)
        const logoMatch = teamSection.match(/(?:src|href)=["']([^"']*\/images\/(?:logos|clubs|teams)\/[A-F0-9]+)[^"']*/i)
        const logoUrl = logoMatch ? `https://jalgpall.ee${logoMatch[1].startsWith('/') ? '' : '/'}${logoMatch[1]}` : undefined

        const existing = findMatch(teamName, existingTeams)
        if (existing) {
          // Check if we can enrich with logo
          if (logoUrl && !existing.logoUrl) {
            enrichments.push({ country: 'EE', name: existing.name, field: 'logoUrl', value: logoUrl, source: 'jalgpall.ee' })
          }
        } else {
          discoveries.push({
            name: teamName,
            country: 'EE',
            league: league.name,
            source: 'jalgpall.ee',
            sourceUrl: `https://jalgpall.ee/voistlused/${league.id}/team/${teamId}?season=${year}`,
            logoUrl,
            discoveredAt: new Date().toISOString(),
            status: 'pending',
          })
        }
      }

      if (config.verbose) console.log(`│      Found ${seen.size} teams, ${discoveries.filter(d => d.country === 'EE' && d.league === league.name).length} new`)
    } catch (err) {
      errors.push(`EE/${league.name}: ${err.message}`)
      console.log(`│      ⚠ Failed to scan ${league.name}: ${err.message}`)
    }
    await sleep(config.federationDelay)
  }

  return { discoveries, enrichments, errors }
}

// ═══════════════════════════════════════════════════════════
//  Latvia — Wikipedia Latvian Higher League + data.gov.lv fallback
// ═══════════════════════════════════════════════════════════

async function scanLatvia(config, existingTeams) {
  const discoveries = []
  const enrichments = []
  const errors = []

  // Source 1: Wikipedia for professional clubs
  console.log('│    LV: Scanning Wikipedia Latvian Higher League...')
  try {
    const wikiUrl = 'https://en.wikipedia.org/wiki/Latvian_Higher_League'
    const html = await fetchUrl(wikiUrl)

    // Extract team names from Wikipedia table rows
    // Pattern: wiki links in club tables, e.g. <a href="/wiki/FK_RFS" title="FK RFS">FK RFS</a>
    const clubPattern = /<a[^>]*href="\/wiki\/[^"]*"[^>]*title="([^"]*)"[^>]*>([^<]+)<\/a>/g
    const seen = new Set()

    let match
    while ((match = clubPattern.exec(html)) !== null) {
      const teamName = match[2].trim()
      // Filter to likely football club names
      if (!/\b(FC|FK|FS|BFC|JFC)\b/i.test(teamName) && !/\b(Daugavpils|Liepāja|Jelgava|Valmiera|Ventspils|Riga|Rīga|Jūrmala|Tukums)\b/i.test(teamName)) continue
      if (seen.has(normalize(teamName))) continue
      seen.add(normalize(teamName))

      const existing = findMatch(teamName, existingTeams)
      if (!existing) {
        discoveries.push({
          name: teamName,
          country: 'LV',
          league: 'Virslīga',
          source: 'wikipedia',
          sourceUrl: wikiUrl,
          discoveredAt: new Date().toISOString(),
          status: 'pending',
        })
      }
    }
    if (config.verbose) console.log(`│      Wikipedia: ${seen.size} clubs checked, ${discoveries.filter(d => d.country === 'LV').length} new`)
  } catch (err) {
    errors.push(`LV/Wikipedia: ${err.message}`)
    console.log(`│      ⚠ Wikipedia scan failed: ${err.message}`)
  }

  await sleep(config.federationDelay)

  // Source 2: data.gov.lv NGO registry (if URL configured)
  if (config.federationSources.LV_GOV) {
    console.log('│    LV: Scanning data.gov.lv NGO registry...')
    try {
      const csvUrl = config.federationSources.LV_GOV
      const csv = await fetchUrl(csvUrl)
      const lines = csv.split('\n')

      // CSV fields: regcode, name, type, status, area_of_activity, ...
      // Filter for rows containing "futbol" or NACE 93.1
      let found = 0
      for (const line of lines.slice(1)) { // Skip header
        const lower = line.toLowerCase()
        if (!lower.includes('futbol') && !lower.includes('93.1')) continue
        // Extract name field (typically second column)
        const cols = line.split(';').length > 1 ? line.split(';') : line.split(',')
        const orgName = (cols[1] || '').replace(/^"|"$/g, '').trim()
        if (!orgName || orgName.length < 3) continue

        found++
        const existing = findMatch(orgName, existingTeams)
        if (!existing) {
          const regCode = (cols[0] || '').replace(/^"|"$/g, '').trim()
          discoveries.push({
            name: orgName,
            country: 'LV',
            source: 'data.gov.lv',
            sourceUrl: csvUrl,
            regCode: regCode || undefined,
            discoveredAt: new Date().toISOString(),
            status: 'pending',
          })
        }
      }
      if (config.verbose) console.log(`│      data.gov.lv: ${found} football orgs found, ${discoveries.filter(d => d.source === 'data.gov.lv').length} new`)
    } catch (err) {
      errors.push(`LV/data.gov.lv: ${err.message}`)
      console.log(`│      ⚠ data.gov.lv scan failed: ${err.message}`)
    }
  }

  return { discoveries, enrichments, errors }
}

// ═══════════════════════════════════════════════════════════
//  Lithuania — toplyga.lt + Wikipedia A Lyga
// ═══════════════════════════════════════════════════════════

async function scanLithuania(config, existingTeams) {
  const discoveries = []
  const enrichments = []
  const errors = []

  // Source 1: Wikipedia A Lyga
  console.log('│    LT: Scanning Wikipedia A Lyga...')
  try {
    const wikiUrl = 'https://en.wikipedia.org/wiki/A_Lyga'
    const html = await fetchUrl(wikiUrl)

    const clubPattern = /<a[^>]*href="\/wiki\/[^"]*"[^>]*title="([^"]*)"[^>]*>([^<]+)<\/a>/g
    const seen = new Set()

    let match
    while ((match = clubPattern.exec(html)) !== null) {
      const teamName = match[2].trim()
      if (!/\b(FC|FK|FA|SC)\b/i.test(teamName) && !/\b(Vilnius|Kaunas|Klaipėda|Šiauliai|Panevėžys|Marijampolė|Alytus|Telšiai|Sūduva)\b/i.test(teamName)) continue
      if (seen.has(normalize(teamName))) continue
      seen.add(normalize(teamName))

      const existing = findMatch(teamName, existingTeams)
      if (!existing) {
        discoveries.push({
          name: teamName,
          country: 'LT',
          league: 'A Lyga',
          source: 'wikipedia',
          sourceUrl: wikiUrl,
          discoveredAt: new Date().toISOString(),
          status: 'pending',
        })
      }
    }
    if (config.verbose) console.log(`│      Wikipedia: ${seen.size} clubs checked, ${discoveries.filter(d => d.country === 'LT').length} new`)
  } catch (err) {
    errors.push(`LT/Wikipedia: ${err.message}`)
    console.log(`│      ⚠ Wikipedia A Lyga scan failed: ${err.message}`)
  }

  await sleep(config.federationDelay)

  // Source 2: toplyga.lt
  if (config.federationSources.LT && config.federationSources.LT.length > 0) {
    for (const source of config.federationSources.LT) {
      console.log(`│    LT: Scanning ${source.name}...`)
      try {
        const html = await fetchUrl(source.url)
        // Extract team names from HTML — toplyga.lt uses /komanda/{slug} pattern
        const teamPattern = /\/komanda\/([a-z0-9-]+)[^>]*>([^<]+)/gi
        const seen = new Set()

        let match
        while ((match = teamPattern.exec(html)) !== null) {
          const teamName = match[2].trim()
          if (seen.has(normalize(teamName)) || teamName.length < 3) continue
          seen.add(normalize(teamName))

          const existing = findMatch(teamName, existingTeams)
          if (!existing) {
            discoveries.push({
              name: teamName,
              country: 'LT',
              league: source.name,
              source: 'toplyga.lt',
              sourceUrl: source.url,
              discoveredAt: new Date().toISOString(),
              status: 'pending',
            })
          }
        }
        if (config.verbose) console.log(`│      ${source.name}: ${seen.size} teams, ${discoveries.filter(d => d.source === 'toplyga.lt' && d.league === source.name).length} new`)
      } catch (err) {
        errors.push(`LT/${source.name}: ${err.message}`)
        console.log(`│      ⚠ ${source.name} scan failed: ${err.message}`)
      }
      await sleep(config.federationDelay)
    }
  }

  return { discoveries, enrichments, errors }
}

// ═══════════════════════════════════════════════════════════
//  Main task runner
// ═══════════════════════════════════════════════════════════

async function run(config) {
  const result = { added: 0, updated: 0, skipped: 0, errors: [] }

  // Load existing teams for matching
  const existingTeams = {}
  const COUNTRIES = { 'teams-lv.json': 'LV', 'teams-ee.json': 'EE', 'teams-lt.json': 'LT' }
  for (const [file, country] of Object.entries(COUNTRIES)) {
    const filePath = path.join(config.dataDir, file)
    if (fs.existsSync(filePath)) {
      try {
        existingTeams[country] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      } catch (err) {
        result.errors.push(`Failed to parse ${file}: ${err.message}`)
        existingTeams[country] = []
      }
    } else {
      existingTeams[country] = []
    }
  }

  const allExisting = [...existingTeams.LV, ...existingTeams.EE, ...existingTeams.LT]
  console.log(`│  Loaded ${allExisting.length} existing teams (LV: ${existingTeams.LV.length}, EE: ${existingTeams.EE.length}, LT: ${existingTeams.LT.length})`)

  // Load existing discoveries to avoid duplicates
  const discoveriesPath = path.join(config.dataDir, 'federation-discoveries.json')
  let existingDiscoveries = []
  if (fs.existsSync(discoveriesPath)) {
    try {
      existingDiscoveries = JSON.parse(fs.readFileSync(discoveriesPath, 'utf-8'))
    } catch { existingDiscoveries = [] }
  }

  const allDiscoveries = []
  const allEnrichments = []

  // Scan each country
  const eeResult = await scanEstonia(config, existingTeams.EE)
  result.errors.push(...eeResult.errors)
  allDiscoveries.push(...eeResult.discoveries)
  allEnrichments.push(...eeResult.enrichments)

  const lvResult = await scanLatvia(config, existingTeams.LV)
  result.errors.push(...lvResult.errors)
  allDiscoveries.push(...lvResult.discoveries)
  allEnrichments.push(...lvResult.enrichments)

  const ltResult = await scanLithuania(config, existingTeams.LT)
  result.errors.push(...ltResult.errors)
  allDiscoveries.push(...ltResult.discoveries)
  allEnrichments.push(...ltResult.enrichments)

  // Deduplicate against existing discoveries
  const existingNorms = new Set(existingDiscoveries.map(d => `${d.country}:${normalize(d.name)}`))
  const newDiscoveries = allDiscoveries.filter(d => !existingNorms.has(`${d.country}:${normalize(d.name)}`))

  console.log(`│  Scan complete: ${allDiscoveries.length} total discovered, ${newDiscoveries.length} new, ${allEnrichments.length} enrichments`)

  if (config.dryRun) {
    if (newDiscoveries.length > 0) {
      console.log('│  [DRY RUN] Would add discoveries:')
      for (const d of newDiscoveries.slice(0, 10)) {
        console.log(`│    ${d.country} ${d.name} (${d.source}, ${d.league || 'n/a'})`)
      }
      if (newDiscoveries.length > 10) console.log(`│    ... and ${newDiscoveries.length - 10} more`)
    }
    result.added = newDiscoveries.length
    result.updated = allEnrichments.length
    return result
  }

  // Merge new discoveries into existing file
  const merged = [...existingDiscoveries, ...newDiscoveries]
  fs.writeFileSync(discoveriesPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
  result.added = newDiscoveries.length
  result.updated = allEnrichments.length

  // Write enrichment suggestions to report
  if (allEnrichments.length > 0) {
    console.log(`│  Enrichment suggestions:`)
    for (const e of allEnrichments) {
      console.log(`│    ${e.country}/${e.name}: ${e.field} from ${e.source}`)
    }
  }

  return result
}

module.exports = { name, run }
