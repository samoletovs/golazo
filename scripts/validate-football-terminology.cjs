const fs = require('node:fs')
const path = require('node:path')

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'en.json')

function fail(message) {
  console.error(`\n[football-terminology] ${message}`)
  process.exitCode = 1
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const en = loadJson(enPath)

const canonicalValues = {
  'match.full': 'Full match',
  'tournament.games': 'Number of matches',
  'tournament.addGame': 'Add match',
  'schedule.addMatch': 'Fixture',
  'import.duration': 'Match duration',
  'import.fetch': 'Find matches',
  'import.noGamesForTeam': 'No matches found for "{{team}}"',
  'import.foundGames': '{{count}} matches for your team ({{total}} total)',
  'import.addedGames': '{{count}} matches added from {{tournament}}',
}

for (const [key, expected] of Object.entries(canonicalValues)) {
  const actual = en[key]
  if (actual !== expected) {
    fail(`${key} expected "${expected}" but got "${actual}"`)
  }
}

const tokenBans = [/\bgame\b/i, /\bgames\b/i]
const namespacesToCheck = ['import.', 'tournament.']
const namespaceAllowList = new Set([
  // key names can contain "Games" historically, but visible value must use match terminology
  'import.noGamesForTeam',
  'import.foundGames',
  'import.addedGames',
  'tournament.addGame',
])

for (const [key, value] of Object.entries(en)) {
  if (typeof value !== 'string') continue
  if (!namespacesToCheck.some((prefix) => key.startsWith(prefix))) continue

  for (const rule of tokenBans) {
    if (rule.test(value)) {
      fail(`value for ${key} contains banned term in UEFA/FIFA mode: "${value}"`)
      break
    }
  }

  if (namespaceAllowList.has(key)) {
    continue
  }
}

if (!process.exitCode) {
  console.log('[football-terminology] OK - UEFA/FIFA terminology checks passed')
}
