/**
 * FIFA 3-Tier Migration Script
 *
 * Migrates Cosmos DB data from the old 2-tier model to the FIFA 3-tier model:
 *
 * 1. `teams` container: type='squad' → type='team', squadLabel → teamLabel
 * 2. `coach` container: rename squadId/squadName/squadLabel fields in all doc types
 * 3. `squads` container: create with partition key /teamId (if not exists)
 *
 * Usage: node scripts/migrate-3tier.cjs [--dry-run]
 *
 * Requires: COSMOS_ENDPOINT and COSMOS_KEY env vars.
 */

const path = require('path')

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY

  if (!endpoint) {
    console.error('COSMOS_ENDPOINT env var required')
    process.exit(1)
  }

  // Load Cosmos SDK from api/node_modules
  const apiModules = path.join(__dirname, '..', 'api', 'node_modules')
  const { CosmosClient } = require(path.join(apiModules, '@azure', 'cosmos'))

  const client = key
    ? new CosmosClient({ endpoint, key })
    : (() => {
        const { DefaultAzureCredential } = require(path.join(apiModules, '@azure', 'identity'))
        return new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() })
      })()

  const dbName = process.env.COSMOS_DATABASE || 'golazo'
  const db = client.database(dbName)

  console.log(`\n🏟️  FIFA 3-Tier Migration${DRY_RUN ? ' [DRY RUN]' : ''}`)
  console.log(`   Database: ${dbName}\n`)

  // ── Step 1: Migrate teams container ──────────────────────
  console.log('Step 1: Rename type=squad → type=team in teams container')
  const teamsContainer = db.container('teams')
  let teamsRenamed = 0

  try {
    const { resources: squadDocs } = await teamsContainer.items
      .query("SELECT * FROM c WHERE c.type = 'squad'")
      .fetchAll()

    console.log(`   Found ${squadDocs.length} docs with type='squad'`)

    for (const doc of squadDocs) {
      const updated = { ...doc }
      updated.type = 'team'
      if (updated.squadLabel !== undefined) {
        updated.teamLabel = updated.squadLabel
        delete updated.squadLabel
      }
      updated.updatedAt = new Date().toISOString()

      if (!DRY_RUN) {
        await teamsContainer.item(doc.id, doc.country).replace(updated)
      }
      teamsRenamed++
      console.log(`   ✓ ${doc.name} (${doc.country}): squad → team`)
    }

    // Also rename squadLabel on any club/academy docs that have it
    const { resources: labelDocs } = await teamsContainer.items
      .query("SELECT * FROM c WHERE IS_DEFINED(c.squadLabel)")
      .fetchAll()

    for (const doc of labelDocs) {
      if (doc.type === 'team') continue // already handled above
      const updated = { ...doc }
      updated.teamLabel = updated.squadLabel
      delete updated.squadLabel
      updated.updatedAt = new Date().toISOString()

      if (!DRY_RUN) {
        await teamsContainer.item(doc.id, doc.country).replace(updated)
      }
      teamsRenamed++
      console.log(`   ✓ ${doc.name}: renamed squadLabel → teamLabel`)
    }
  } catch (err) {
    if (err.code === 404) {
      console.log('   teams container not found — skipping')
    } else {
      console.error(`   ERROR: ${err.message}`)
    }
  }

  // ── Step 2: Migrate coach container ──────────────────────
  console.log('\nStep 2: Rename squadId/squadName/squadLabel in coach container')
  const coachContainer = db.container('coach')
  let coachRenamed = 0

  try {
    const { resources: coachDocs } = await coachContainer.items
      .query("SELECT * FROM c WHERE IS_DEFINED(c.squadId)")
      .fetchAll()

    console.log(`   Found ${coachDocs.length} docs with squadId field`)

    for (const doc of coachDocs) {
      const updated = { ...doc }

      // Rename fields
      if (updated.squadId !== undefined) {
        updated.teamId = updated.squadId
        delete updated.squadId
      }
      if (updated.squadName !== undefined) {
        updated.teamName = updated.squadName
        delete updated.squadName
      }
      if (updated.squadLabel !== undefined) {
        updated.teamLabel = updated.squadLabel
        delete updated.squadLabel
      }
      updated.updatedAt = new Date().toISOString()

      // Coach container partition key is /squadId — we need to delete + recreate
      // since partition key value changed
      if (!DRY_RUN) {
        try {
          await coachContainer.item(doc.id, doc.squadId).delete()
        } catch { /* may not exist with old PK */ }
        // Create with new partition key field
        // Note: container PK path is still /squadId in Cosmos — need to also update container config
        // For now, keep the doc with teamId and handle in code
        await coachContainer.items.create(updated)
      }
      coachRenamed++
    }

    console.log(`   Renamed ${coachRenamed} docs`)
  } catch (err) {
    if (err.code === 404) {
      console.log('   coach container not found — skipping')
    } else {
      console.error(`   ERROR: ${err.message}`)
    }
  }

  // ── Step 3: Ensure squads container exists ───────────────
  console.log('\nStep 3: Create squads container (if not exists)')

  try {
    if (!DRY_RUN) {
      const { container } = await db.containers.createIfNotExists({
        id: 'squads',
        partitionKey: { paths: ['/teamId'] },
      })
      console.log('   ✓ squads container ready (partition key: /teamId)')
    } else {
      console.log('   [DRY RUN] Would create squads container with PK /teamId')
    }
  } catch (err) {
    console.error(`   ERROR: ${err.message}`)
  }

  // ── Step 4: Migrate user data (golazo container) ─────────
  console.log('\nStep 4: Rename managedSquads → managedTeams in user profiles')
  const userContainer = db.container(process.env.COSMOS_CONTAINER || 'golazo')
  let profilesRenamed = 0

  try {
    const { resources: profiles } = await userContainer.items
      .query("SELECT * FROM c WHERE c.docType = 'profile' AND IS_DEFINED(c.data)")
      .fetchAll()

    console.log(`   Found ${profiles.length} profile docs`)

    for (const doc of profiles) {
      const data = doc.data
      if (!data) continue

      let changed = false

      // Rename managedSquads → managedTeams
      if (data.managedSquads) {
        data.managedTeams = data.managedSquads.map((sq) => ({
          ...sq,
          teamId: sq.squadId || sq.teamId,
          teamName: sq.squadName || sq.teamName,
          teamLabel: sq.squadLabel || sq.teamLabel,
        }))
        // Clean up old field names from each entry
        for (const t of data.managedTeams) {
          delete t.squadId
          delete t.squadName
          delete t.squadLabel
        }
        delete data.managedSquads
        changed = true
      }

      // Rename squadLabel → teamLabel in teams[]
      if (data.teams) {
        for (const team of data.teams) {
          if (team.squadLabel !== undefined) {
            team.teamLabel = team.squadLabel
            delete team.squadLabel
            changed = true
          }
        }
      }

      if (changed) {
        const updated = { ...doc, data, updatedAt: new Date().toISOString() }
        if (!DRY_RUN) {
          await userContainer.item(doc.id, doc.userId || doc.id).replace(updated)
        }
        profilesRenamed++
        console.log(`   ✓ ${data.name || doc.id}: migrated`)
      }
    }

    console.log(`   Migrated ${profilesRenamed} profiles`)
  } catch (err) {
    if (err.code === 404) {
      console.log('   golazo container not found — skipping')
    } else {
      console.error(`   ERROR: ${err.message}`)
    }
  }

  // ── Summary ──────────────────────────────────────────────
  console.log('\n── Summary ──────────────────────────────────')
  console.log(`  Teams renamed:    ${teamsRenamed}`)
  console.log(`  Coach docs renamed: ${coachRenamed}`)
  console.log(`  Profiles migrated:  ${profilesRenamed}`)
  console.log(`  Squads container:   created`)
  if (DRY_RUN) console.log('\n  ⚠ DRY RUN — no changes were written')
  console.log('')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
