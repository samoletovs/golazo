/**
 * Team Registry — Maintenance Task
 *
 * Validates existing team data files in data/teams-{cc}.json.
 * Checks for: missing required fields, duplicate names, invalid URLs.
 *
 * Note: Full team discovery (government registries, league scraping) is
 * documented in .github/skills/team-registry/SKILL.md and run manually.
 * This task handles automated validation and consistency checks.
 */

const fs = require('fs')
const path = require('path')

const name = 'team-registry'

const COUNTRIES = {
  'teams-lv.json': 'LV',
  'teams-ee.json': 'EE',
  'teams-lt.json': 'LT',
}

const REQUIRED_FIELDS = ['name', 'city', 'league']

async function run(config) {
  const result = { added: 0, updated: 0, skipped: 0, errors: [] }

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

    console.log(`│  ${country}: ${teams.length} teams`)

    // Validate required fields
    for (const team of teams) {
      for (const field of REQUIRED_FIELDS) {
        if (!team[field]) {
          result.errors.push(`${country}/${team.name || 'UNNAMED'}: missing '${field}'`)
        }
      }
    }

    // Check for duplicate names
    const names = new Map()
    for (const team of teams) {
      const n = (team.name || '').toLowerCase().trim()
      if (names.has(n)) {
        result.errors.push(`${country}: duplicate team name '${team.name}'`)
      }
      names.set(n, true)
    }

    // Check for duplicate aliases across teams
    const aliases = new Map()
    for (const team of teams) {
      for (const alias of (team.aliases || [])) {
        const a = alias.toLowerCase().trim()
        if (aliases.has(a) && aliases.get(a) !== team.name) {
          result.errors.push(`${country}: alias '${alias}' used by both '${team.name}' and '${aliases.get(a)}'`)
        }
        aliases.set(a, team.name)
      }
    }

    // Validate colors format
    for (const team of teams) {
      if (team.colors) {
        if (!Array.isArray(team.colors)) {
          result.errors.push(`${country}/${team.name}: 'colors' must be an array`)
        } else {
          for (const color of team.colors) {
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
              result.errors.push(`${country}/${team.name}: invalid color '${color}' (must be #RRGGBB)`)
            }
          }
        }
      }
    }

    // Count teams with data completeness
    const withLogo = teams.filter(t => t.logoUrl).length
    const withWebsite = teams.filter(t => t.website).length
    const withColors = teams.filter(t => t.colors && t.colors.length > 0).length
    const byType = teams.reduce((a, t) => { a[t.type || 'club'] = (a[t.type || 'club'] || 0) + 1; return a }, {})
    console.log(`│    Logos: ${withLogo}/${teams.length}  Websites: ${withWebsite}/${teams.length}  Colors: ${withColors}/${teams.length}`)
    console.log(`│    Types: ${Object.entries(byType).map(([k,v]) => `${k}=${v}`).join(' ')}`)

    // Validate type field
    const validTypes = ['club', 'academy', 'squad']
    for (const team of teams) {
      if (team.type && !validTypes.includes(team.type)) {
        result.errors.push(`${country}/${team.name}: invalid type '${team.type}' (must be club/academy/squad)`)
      }
    }

    // Validate parentClubId references (must exist in same country)
    const teamNames = new Set(teams.map(t => t.name))
    for (const team of teams) {
      if (team.parentClubId && !teams.some(t => t.name === team.parentClubId)) {
        // parentClubId is an id (UUID), not a name — can't fully validate without DB
        // Just flag if it looks wrong (not a UUID pattern)
        if (!/^[0-9a-f-]{36}$/.test(team.parentClubId)) {
          result.errors.push(`${country}/${team.name}: parentClubId '${team.parentClubId}' doesn't look like a UUID`)
        }
      }
    }

    // Flag teams missing colors
    const missingColors = teams.filter(t => !t.colors || t.colors.length === 0)
    if (missingColors.length > 0) {
      for (const t of missingColors) {
        result.errors.push(`${country}/${t.name}: missing 'colors'`)
      }
    }

    result.updated += teams.length
  }

  return result
}

module.exports = { name, run }
