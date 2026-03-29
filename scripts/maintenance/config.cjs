/**
 * Shared configuration for Golazo maintenance tasks.
 *
 * Loads environment variables and provides constants used by all tasks.
 * Works both locally (VS Code / CLI) and in CI (GitHub Actions).
 */

const path = require('path')
const fs = require('fs')

// Load .env from project root (no dotenv dependency)
const envPath = path.join(__dirname, '..', '..', '.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

const config = {
  // ── Paths ──
  projectRoot: path.resolve(__dirname, '..', '..'),
  dataDir: path.resolve(__dirname, '..', '..', 'data'),
  srcDir: path.resolve(__dirname, '..', '..', 'src'),
  i18nDir: path.resolve(__dirname, '..', '..', 'src', 'i18n'),

  // ── YouTube API ──
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
  youtubeMaxResultsPerQuery: 5,
  youtubeSafeSearch: 'strict',

  // Kid-safe coaching channels (prioritized in search results)
  youtubeChannelWhitelist: [
    'UCz7UqfHQlMIUGRE4o9hNV4g', // Progressive Soccer Training
    'UCVxAPiYFwv0FRJrRWHLJavw', // 7MLC
    'UCZFhj_r-MjoPCFVUo3E1ZRg', // Joner 1on1
    'UC5MYXO0oFR0EuBvweKfFNRg', // Unisport
    'UCpVuuHp-kHT_h0GFuvMrxeg', // Techne Football
    'UCvPAgfmWpgB5p3nEQl0S1eA', // iSoccer
    'UCJo2sIb13JlERa0Y4Y_fqxA', // Simply Soccer
    'UCs7dGBnPXYfSwq1URvfYASw', // Become Elite
    'UCf-4kD62l1ByaNCqTB8Szhw', // Train Effective
  ],

  // ── Cosmos DB (for team-registry task) ──
  cosmosEndpoint: process.env.COSMOS_ENDPOINT || '',
  cosmosDatabase: process.env.COSMOS_DATABASE || 'golazo',

  // ── Flags ──
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  taskFilter: (() => {
    const idx = process.argv.indexOf('--task')
    return idx !== -1 ? process.argv[idx + 1] : null
  })(),
}

module.exports = config
