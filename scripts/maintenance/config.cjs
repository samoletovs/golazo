/**
 * Shared configuration for Golazo maintenance tasks.
 *
 * Loads environment variables and provides constants used by all tasks.
 * Works both locally (VS Code / CLI) and in CI (GitHub Actions).
 */

const path = require('path')

// Try to load .env from project root (local dev only)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
} catch {
  // dotenv not installed in CI — env vars set by GitHub Actions
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
