/**
 * Team Health Checker — Maintenance Task
 *
 * Validates the health of team registry entries:
 *   - URL liveness: checks website and logoUrl resolve (HTTP HEAD)
 *   - Staleness: flags teams not verified in >180 days
 *   - Completeness: scores each team on data completeness (0-7)
 *
 * Output: data/team-health-report.json
 *
 * This task is slow (300+ teams × 500ms each) — excluded from default runs.
 * Use: npm run maintain:health  or  npm run maintain:full
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const name = 'team-health'

const COUNTRIES = {
  'teams-lv.json': 'LV',
  'teams-ee.json': 'EE',
  'teams-lt.json': 'LT',
}

const COMPLETENESS_FIELDS = ['name', 'city', 'league', 'website', 'logoUrl', 'colors', 'foundedYear']

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/** Check if a URL is alive via HTTP HEAD (follows redirects) */
function checkUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string') return resolve({ alive: false, reason: 'missing' })
    if (!url.startsWith('http')) return resolve({ alive: false, reason: 'invalid-protocol' })

    const client = url.startsWith('https') ? https : http
    const req = client.request(url, {
      method: 'HEAD',
      timeout,
      headers: { 'User-Agent': 'Golazo/1.0 (naurolabs.com)' },
    }, (res) => {
      // Follow one redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return checkUrl(res.headers.location, timeout).then(resolve)
      }
      resolve({ alive: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode })
    })
    req.on('error', (err) => resolve({ alive: false, reason: err.code || err.message }))
    req.on('timeout', () => { req.destroy(); resolve({ alive: false, reason: 'timeout' }) })
    req.end()
  })
}

async function run(config) {
  const result = { added: 0, updated: 0, skipped: 0, errors: [] }
  const report = {
    generatedAt: new Date().toISOString(),
    summary: { total: 0, verified: 0, deadWebsites: 0, deadLogos: 0, stale: 0, avgCompleteness: 0 },
    countries: {},
  }

  const stalenessThreshold = config.healthStalenessThresholdDays || 180
  const now = Date.now()

  for (const [file, country] of Object.entries(COUNTRIES)) {
    const filePath = path.join(config.dataDir, file)
    if (!fs.existsSync(filePath)) {
      console.log(`│  ⊘ ${file} not found — skipping`)
      result.skipped++
      continue
    }

    let teams
    try {
      teams = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (err) {
      result.errors.push(`Failed to parse ${file}: ${err.message}`)
      continue
    }

    console.log(`│  ${country}: checking ${teams.length} teams...`)
    const countryReport = { total: teams.length, deadWebsites: [], deadLogos: [], stale: [], teams: [] }

    for (const team of teams) {
      const teamReport = {
        name: team.name,
        completeness: 0,
        websiteAlive: null,
        logoAlive: null,
        stale: false,
      }

      // Completeness score
      for (const field of COMPLETENESS_FIELDS) {
        if (team[field]) teamReport.completeness++
      }

      // URL checks (skip in dry-run to avoid network calls)
      if (!config.dryRun) {
        if (team.website) {
          const check = await checkUrl(team.website, config.healthTimeout || 10000)
          teamReport.websiteAlive = check.alive
          if (!check.alive) {
            countryReport.deadWebsites.push({ name: team.name, url: team.website, reason: check.reason || `HTTP ${check.status}` })
          }
          await sleep(config.healthDelay || 500)
        }

        if (team.logoUrl) {
          const check = await checkUrl(team.logoUrl, config.healthTimeout || 10000)
          teamReport.logoAlive = check.alive
          if (!check.alive) {
            countryReport.deadLogos.push({ name: team.name, url: team.logoUrl, reason: check.reason || `HTTP ${check.status}` })
          }
          await sleep(config.healthDelay || 500)
        }
      } else {
        // Dry-run: just check if fields exist
        teamReport.websiteAlive = team.website ? 'skip-dry-run' : null
        teamReport.logoAlive = team.logoUrl ? 'skip-dry-run' : null
      }

      // Staleness check
      if (team.lastVerifiedAt) {
        const daysSince = (now - new Date(team.lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince > stalenessThreshold) {
          teamReport.stale = true
          countryReport.stale.push({ name: team.name, lastVerified: team.lastVerifiedAt, daysAgo: Math.round(daysSince) })
        }
      } else {
        // Never verified = stale
        teamReport.stale = true
        countryReport.stale.push({ name: team.name, lastVerified: null, daysAgo: null })
      }

      countryReport.teams.push(teamReport)
    }

    report.countries[country] = {
      total: countryReport.total,
      deadWebsites: countryReport.deadWebsites.length,
      deadLogos: countryReport.deadLogos.length,
      stale: countryReport.stale.length,
      avgCompleteness: countryReport.teams.length > 0
        ? (countryReport.teams.reduce((s, t) => s + t.completeness, 0) / countryReport.teams.length).toFixed(1)
        : 0,
      deadWebsiteDetails: countryReport.deadWebsites,
      deadLogoDetails: countryReport.deadLogos,
      staleDetails: countryReport.stale.slice(0, 20), // Limit for readability
    }

    report.summary.total += countryReport.total
    report.summary.deadWebsites += countryReport.deadWebsites.length
    report.summary.deadLogos += countryReport.deadLogos.length
    report.summary.stale += countryReport.stale.length

    // Print summary for this country
    console.log(`│    Completeness: avg ${report.countries[country].avgCompleteness}/7`)
    if (countryReport.deadWebsites.length > 0) {
      console.log(`│    Dead websites: ${countryReport.deadWebsites.length}`)
      for (const d of countryReport.deadWebsites.slice(0, 5)) {
        console.log(`│      ${d.name}: ${d.url} (${d.reason})`)
      }
    }
    if (countryReport.deadLogos.length > 0) {
      console.log(`│    Dead logos: ${countryReport.deadLogos.length}`)
    }
    if (countryReport.stale.length > 0) {
      console.log(`│    Stale (>${stalenessThreshold}d): ${countryReport.stale.length}`)
    }

    result.updated += countryReport.total
  }

  // Calculate overall average completeness
  const allTeams = Object.values(report.countries).reduce((s, c) => s + c.total, 0)
  const allCompleteness = Object.values(report.countries).reduce((s, c) => s + parseFloat(c.avgCompleteness) * c.total, 0)
  report.summary.avgCompleteness = allTeams > 0 ? (allCompleteness / allTeams).toFixed(1) : 0
  report.summary.verified = report.summary.total - report.summary.stale

  // Write report
  const reportPath = path.join(config.dataDir, 'team-health-report.json')
  if (!config.dryRun) {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8')
    console.log(`│  Report saved to data/team-health-report.json`)
  } else {
    console.log(`│  [DRY RUN] Would save report to data/team-health-report.json`)
  }

  // Flag as errors if critical issues found
  if (report.summary.deadWebsites > 0) {
    result.errors.push(`${report.summary.deadWebsites} dead website URL(s) detected`)
  }
  if (report.summary.deadLogos > 0) {
    result.errors.push(`${report.summary.deadLogos} dead logo URL(s) detected`)
  }

  return result
}

module.exports = { name, run }
