/**
 * Cosmos Sync — Maintenance Task
 *
 * Upserts validated team data from JSON files to Cosmos DB.
 * Runs AFTER team-registry validation passes.
 *
 * Skips gracefully when COSMOS_ENDPOINT is not set (CI environments).
 * Reuses the same logic as scripts/seed-teams.cjs but integrated
 * into the maintenance pipeline.
 */

const { randomUUID } = require('crypto')
const fs = require('fs')
const path = require('path')

const name = 'cosmos-sync'

const COUNTRIES = {
  'teams-lv.json': 'LV',
  'teams-ee.json': 'EE',
  'teams-lt.json': 'LT',
}

function toSharedTeam(raw, country) {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    country,
    name: raw.name,
    abbreviation: raw.abbreviation || undefined,
    aliases: raw.aliases || [],
    type: raw.type || 'club',
    city: raw.city || undefined,
    website: raw.website || undefined,
    logoUrl: raw.logoUrl || undefined,
    colors: raw.colors || undefined,
    foundedYear: raw.foundedYear || undefined,
    league: raw.league || undefined,
    ageGroups: raw.ageGroups || undefined,
    socialMedia: raw.socialMedia || undefined,
    stadium: raw.stadium || undefined,
    parentClubId: raw.parentClubId || undefined,
    birthYear: raw.birthYear || undefined,
    squadLabel: raw.squadLabel || undefined,
    regCode: raw.regCode || undefined,
    verified: !!(raw.website || raw.logoUrl),
    verifiedAt: (raw.website || raw.logoUrl) ? now : undefined,
    addedBy: raw.addedBy || 'system',
    createdAt: now,
    updatedAt: now,
  }
}

async function findExisting(container, country, teamName) {
  const { resources } = await container.items.query({
    query: 'SELECT * FROM c WHERE c.country = @country AND c.name = @name',
    parameters: [
      { name: '@country', value: country },
      { name: '@name', value: teamName },
    ],
  }).fetchAll()
  return resources[0] || null
}

async function run(config) {
  const result = { added: 0, updated: 0, skipped: 0, errors: [] }

  if (!config.cosmosEndpoint) {
    console.log('│  COSMOS_ENDPOINT not set — skipping Cosmos sync')
    console.log('│  (This is expected in CI. Run locally to sync to Cosmos DB.)')
    return result
  }

  if (config.dryRun) {
    // In dry-run, just count teams that would be synced
    for (const [file, country] of Object.entries(COUNTRIES)) {
      const filePath = path.join(config.dataDir, file)
      if (fs.existsSync(filePath)) {
        const teams = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        result.updated += teams.length
        console.log(`│  [DRY RUN] Would sync ${teams.length} ${country} teams to Cosmos`)
      }
    }
    return result
  }

  // Lazy-load Cosmos SDK from api/node_modules
  let CosmosClient, DefaultAzureCredential
  try {
    const apiModules = path.join(config.projectRoot, 'api', 'node_modules')
    CosmosClient = require(path.join(apiModules, '@azure', 'cosmos')).CosmosClient
    DefaultAzureCredential = require(path.join(apiModules, '@azure', 'identity')).DefaultAzureCredential
  } catch (err) {
    result.errors.push(`Cosmos SDK not found in api/node_modules — run 'cd api && npm install' first`)
    return result
  }

  // Connect
  let client
  if (process.env.COSMOS_KEY) {
    client = new CosmosClient({ endpoint: config.cosmosEndpoint, key: process.env.COSMOS_KEY })
  } else {
    client = new CosmosClient({ endpoint: config.cosmosEndpoint, aadCredentials: new DefaultAzureCredential() })
  }

  const db = client.database(config.cosmosDatabase)
  const { container } = await db.containers.createIfNotExists({
    id: 'teams',
    partitionKey: { paths: ['/country'] },
  })
  console.log('│  Connected to Cosmos DB teams container')

  for (const [file, country] of Object.entries(COUNTRIES)) {
    const filePath = path.join(config.dataDir, file)
    if (!fs.existsSync(filePath)) continue

    const teams = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    let created = 0
    let updated = 0

    for (const raw of teams) {
      const team = toSharedTeam(raw, country)
      try {
        const existing = await findExisting(container, country, team.name)
        if (existing) {
          const merged = { ...existing, ...team, id: existing.id, createdAt: existing.createdAt }
          await container.item(existing.id, existing.country).replace(merged)
          updated++
        } else {
          await container.items.create(team)
          created++
        }
      } catch (err) {
        result.errors.push(`${country}/${team.name}: ${err.message}`)
      }
    }

    console.log(`│  ${country}: ${created} created, ${updated} updated`)
    result.added += created
    result.updated += updated
  }

  return result
}

module.exports = { name, run }
