/**
 * Seed script — reads team JSON files from data/ and upserts to Cosmos DB teams container.
 *
 * Usage: node scripts/seed-teams.js [--dry-run]
 *
 * Requires: COSMOS_ENDPOINT env var (uses DefaultAzureCredential).
 * Creates the teams container if it doesn't exist (partition key: /country).
 */

const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

// Lazy-load Cosmos SDK (only available when running from api/ or with npm install in api/)
function getCosmosClient(endpoint) {
  const { CosmosClient } = require(path.join(__dirname, '..', 'api', 'node_modules', '@azure', 'cosmos'));
  const { DefaultAzureCredential } = require(path.join(__dirname, '..', 'api', 'node_modules', '@azure', 'identity'));
  return new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() });
}

const COUNTRIES = {
  'teams-lv.json': 'LV',
  'teams-ee.json': 'EE',
  'teams-lt.json': 'LT',
};

const DATA_DIR = path.join(__dirname, '..', 'data');
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const endpoint = process.env.COSMOS_ENDPOINT;
  if (!endpoint && !DRY_RUN) {
    console.error('COSMOS_ENDPOINT env var required (or use --dry-run)');
    process.exit(1);
  }

  // Load all team files
  const allTeams = [];
  for (const [file, country] of Object.entries(COUNTRIES)) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${file} — not found`);
      continue;
    }
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`Loaded ${raw.length} teams from ${file} (${country})`);

    for (const team of raw) {
      allTeams.push(toSharedTeam(team, country));
    }
  }

  console.log(`\nTotal: ${allTeams.length} teams across ${Object.keys(COUNTRIES).length} countries`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: sample output ---');
    for (const t of allTeams.slice(0, 3)) {
      console.log(JSON.stringify(t, null, 2));
    }
    console.log(`... and ${allTeams.length - 3} more`);
    // Validate all
    const errors = allTeams.flatMap(validate);
    if (errors.length) {
      console.error('\nValidation errors:');
      errors.forEach((e) => console.error(`  - ${e}`));
      process.exit(1);
    }
    console.log('\nAll teams valid.');
    return;
  }

  // Connect to Cosmos
  const client = getCosmosClient(endpoint);
  const db = client.database(process.env.COSMOS_DATABASE || 'golazo');

  // Ensure container exists
  const { container } = await db.containers.createIfNotExists({
    id: 'teams',
    partitionKey: { paths: ['/country'] },
  });
  console.log('Container "teams" ready');

  // Upsert all teams
  let created = 0;
  let updated = 0;
  for (const team of allTeams) {
    try {
      // Check if team already exists (by name + country)
      const existing = await findExisting(container, team.country, team.name);
      if (existing) {
        // Merge: keep existing id, update fields
        const merged = { ...existing, ...team, id: existing.id, createdAt: existing.createdAt };
        await container.item(existing.id, existing.country).replace(merged);
        updated++;
      } else {
        await container.items.create(team);
        created++;
      }
    } catch (err) {
      console.error(`Failed to upsert ${team.name} (${team.country}): ${err.message}`);
    }
  }

  console.log(`\nDone: ${created} created, ${updated} updated`);
}

async function findExisting(container, country, name) {
  const { resources } = await container.items.query({
    query: 'SELECT * FROM c WHERE c.country = @country AND c.name = @name',
    parameters: [
      { name: '@country', value: country },
      { name: '@name', value: name },
    ],
  }).fetchAll();
  return resources[0] || null;
}

function toSharedTeam(raw, country) {
  const now = new Date().toISOString();
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
    addedBy: 'system',
    createdAt: now,
    updatedAt: now,
  };
}

function validate(team) {
  const errors = [];
  if (!team.name) errors.push(`Missing name for team in ${team.country}`);
  if (!team.country || team.country.length !== 2) errors.push(`Invalid country: ${team.country}`);
  if (team.website && !team.website.startsWith('https://')) errors.push(`${team.name}: website must be https`);
  if (!team.aliases || !Array.isArray(team.aliases)) errors.push(`${team.name}: aliases must be array`);
  return errors;
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
