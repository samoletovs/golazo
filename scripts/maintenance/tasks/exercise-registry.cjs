/**
 * Exercise Registry — Maintenance Task
 *
 * Three jobs in one run:
 * 1. ENRICH — Find YouTube videos for exercises missing videoUrl
 * 2. CREATE — Generate new exercise definitions from methodology templates
 * 3. EVALUATE — Check existing exercises for completeness and quality
 *
 * Generated exercises are saved to src/data/exercises-generated.json
 * (JSON, not .ts — consumed by exercises.ts at import time).
 *
 * Uses YouTube Data API v3 (safeSearch=strict, channel whitelist).
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const name = 'exercise-registry'

/**
 * @param {object} config
 * @returns {Promise<{added: number, updated: number, skipped: number, errors: string[]}>}
 */
async function run(config) {
  const result = { added: 0, updated: 0, skipped: 0, errors: [] }

  if (!config.youtubeApiKey) {
    result.errors.push('YOUTUBE_API_KEY not set — skipping video enrichment')
    console.log('│  ℹ Set YOUTUBE_API_KEY in .env to enable video search')
    return result
  }

  // ── 1. Load current exercises ──
  const generatedPath = path.join(config.dataDir, 'exercises-generated.json')
  let generated = []
  if (fs.existsSync(generatedPath)) {
    try {
      generated = JSON.parse(fs.readFileSync(generatedPath, 'utf-8'))
    } catch {
      result.errors.push('Failed to parse exercises-generated.json — starting fresh')
      generated = []
    }
  }

  // Load curated exercises (read the .ts file and extract IDs)
  const curatedIds = getCuratedExerciseIds(config)

  // All existing IDs (curated + generated)
  const allExistingIds = new Set([
    ...curatedIds,
    ...generated.map(e => e.id),
  ])

  console.log(`│  Curated: ${curatedIds.length}  Generated: ${generated.length}  Total: ${allExistingIds.size}`)

  // ── 2. ENRICH — find videos for exercises without videoUrl ──
  const needsVideo = generated.filter(e => !e.videoUrl)
  // Also check curated exercises (we'll store video mappings separately)
  const videoMappingsPath = path.join(config.dataDir, 'exercise-videos.json')
  let videoMappings = {}
  if (fs.existsSync(videoMappingsPath)) {
    try {
      videoMappings = JSON.parse(fs.readFileSync(videoMappingsPath, 'utf-8'))
    } catch { videoMappings = {} }
  }

  const curatedNeedVideo = curatedIds.filter(id => !videoMappings[id])
  const toEnrich = [
    ...curatedNeedVideo.map(id => ({ id, nameEn: getExerciseEnglishName(config, id) })),
    ...needsVideo.map(e => ({ id: e.id, nameEn: e.nameEn })),
  ].filter(e => e.nameEn) // skip if we can't find the English name

  if (toEnrich.length > 0) {
    console.log(`│  Enriching ${toEnrich.length} exercises with videos...`)

    for (const ex of toEnrich) {
      try {
        const video = await searchYouTube(ex.nameEn + ' football drill', config)
        if (video) {
          videoMappings[ex.id] = {
            videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
            thumbnailUrl: video.thumbnailUrl,
            channelTitle: video.channelTitle,
            fetchedAt: new Date().toISOString(),
          }
          result.updated++
          if (config.verbose) {
            console.log(`│    ✓ ${ex.id}: ${video.channelTitle} — ${video.title}`)
          }
        } else {
          result.skipped++
          if (config.verbose) console.log(`│    ⊘ ${ex.id}: no suitable video found`)
        }
      } catch (err) {
        result.errors.push(`Video search failed for ${ex.id}: ${err.message}`)
      }

      // Respect API quota — small delay between requests
      await sleep(200)
    }
  } else {
    console.log('│  All exercises already have videos')
  }

  // ── 3. CREATE — generate new exercises from methodology templates ──
  const newExercises = generateNewExercises(allExistingIds)
  if (newExercises.length > 0) {
    // Search videos for each new exercise
    for (const ex of newExercises) {
      if (config.youtubeApiKey) {
        try {
          const video = await searchYouTube(ex.nameEn + ' football drill tutorial', config)
          if (video) {
            ex.videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`
            ex.thumbnailUrl = video.thumbnailUrl
          }
        } catch { /* video optional for new exercises */ }
        await sleep(200)
      }
    }

    // Validate and add to generated list
    for (const ex of newExercises) {
      if (validateExercise(ex)) {
        generated.push(ex)
        result.added++
      } else {
        result.skipped++
        if (config.verbose) console.log(`│    ⊘ Skipped invalid: ${ex.id}`)
      }
    }
  }

  // ── 4. EVALUATE — check existing generated exercises ──
  let incomplete = 0
  for (const ex of generated) {
    if (!ex.videoUrl && videoMappings[ex.id]) {
      ex.videoUrl = videoMappings[ex.id].videoUrl
      ex.thumbnailUrl = videoMappings[ex.id].thumbnailUrl
    }
    if (!ex.nameEn || !ex.descEn) incomplete++
  }
  if (incomplete > 0) {
    console.log(`│  ⚠ ${incomplete} generated exercises are incomplete`)
  }

  // ── 5. Save results ──
  if (!config.dryRun) {
    fs.writeFileSync(videoMappingsPath, JSON.stringify(videoMappings, null, 2))
    fs.writeFileSync(generatedPath, JSON.stringify(generated, null, 2))
    console.log(`│  Saved ${Object.keys(videoMappings).length} video mappings, ${generated.length} generated exercises`)
  } else {
    console.log(`│  [DRY RUN] Would save ${Object.keys(videoMappings).length} video mappings, ${generated.length} generated exercises`)
  }

  return result
}

// ── YouTube Data API v3 Search ──────────────────────────────

/**
 * @param {string} query
 * @param {object} config
 * @returns {Promise<{videoId: string, title: string, thumbnailUrl: string, channelTitle: string, channelId: string} | null>}
 */
function searchYouTube(query, config) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      videoCategoryId: '17', // Sports
      safeSearch: config.youtubeSafeSearch,
      maxResults: String(config.youtubeMaxResultsPerQuery),
      key: config.youtubeApiKey,
    })

    const url = `https://www.googleapis.com/youtube/v3/search?${params}`

    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) {
            reject(new Error(`YouTube API: ${json.error.message}`))
            return
          }
          const items = json.items || []

          // Prefer whitelisted channels
          const whitelist = new Set(config.youtubeChannelWhitelist)
          const preferred = items.find(i => whitelist.has(i.snippet.channelId))
          const best = preferred || items[0]

          if (!best) {
            resolve(null)
            return
          }

          resolve({
            videoId: best.id.videoId,
            title: best.snippet.title,
            thumbnailUrl: best.snippet.thumbnails?.medium?.url ||
                          best.snippet.thumbnails?.default?.url || '',
            channelTitle: best.snippet.channelTitle,
            channelId: best.snippet.channelId,
          })
        } catch (err) {
          reject(new Error(`Failed to parse YouTube response: ${err.message}`))
        }
      })
    }).on('error', reject)
  })
}

// ── Exercise Generation from Methodology Templates ──────────

const EXERCISE_TEMPLATES = [
  // Coerver — ball mastery
  { prefix: 'gen-tech', category: 'technical', methodology: 'coerver', subSkills: ['ballControl', 'dribbling', 'firstTouch', 'weakFoot', 'shooting', 'shortPass', 'longPass', 'volleys', 'headers', 'turns'] },
  // Physical — UEFA youth
  { prefix: 'gen-phys', category: 'physical', methodology: 'uefa', subSkills: ['agility', 'speed', 'endurance', 'coordination', 'balance', 'flexibility', 'strength', 'power', 'reaction'] },
  // Tactical — Horst Wein
  { prefix: 'gen-tact', category: 'tactical', methodology: 'horstWein', subSkills: ['decisionMaking', 'positioning', 'pressing', 'vision', 'transitions', 'spacing', 'support', 'marking'] },
  // Mental — Dan Abrahams
  { prefix: 'gen-ment', category: 'mental', methodology: 'danAbrahams', subSkills: ['visualization', 'selfTalk', 'focus', 'confidence', 'composure', 'resilience', 'leadership', 'communication'] },
  // Match play
  { prefix: 'gen-match', category: 'matchPlay', methodology: 'horstWein', subSkills: ['1v1Attack', '1v1Defend', 'smallSided', 'setPieces', 'crossing', 'counterAttack', 'keepBall'] },
  // Deep practice — Talent Code
  { prefix: 'gen-deep', category: 'technical', methodology: 'talentCode', subSkills: ['slowRepetition', 'targetPractice', 'isolationDrill', 'errorCorrection'] },
]

const EQUIPMENT_OPTIONS = [
  ['ballOnly'],
  ['ballOnly', 'cones'],
  ['ballOnly', 'wall'],
  ['ballOnly', 'partner'],
  ['cones'],
  ['none'],
]

/**
 * Generate new exercises that don't exist yet.
 * Returns up to 10 per run (to stay within YouTube API budget).
 */
function generateNewExercises(existingIds) {
  const newExercises = []
  const maxPerRun = 10

  for (const template of EXERCISE_TEMPLATES) {
    for (const subSkill of template.subSkills) {
      if (newExercises.length >= maxPerRun) break

      // Generate difficulty variants (1-3)
      for (let diff = 1; diff <= 3; diff++) {
        const id = `${template.prefix}-${subSkill}-d${diff}`
        if (existingIds.has(id)) continue
        if (newExercises.length >= maxPerRun) break

        const nameEn = generateExerciseName(subSkill, diff, template.category)
        const descEn = generateExerciseDescription(subSkill, diff, template.category, template.methodology)

        newExercises.push({
          id,
          nameKey: `ex.gen.${id}`,
          descriptionKey: `ex.gen.${id}.desc`,
          nameEn,
          descEn,
          category: template.category,
          subSkill,
          difficulty: Math.min(diff + 1, 5),
          durationMinutes: [5, 10, 15][diff - 1],
          equipment: EQUIPMENT_OPTIONS[Math.floor(Math.random() * 3)],
          positions: [],
          methodology: template.methodology,
          source: 'generated',
          createdAt: new Date().toISOString(),
        })
      }
    }
    if (newExercises.length >= maxPerRun) break
  }

  return newExercises
}

function generateExerciseName(subSkill, difficulty, category) {
  const diffLabel = ['Beginner', 'Intermediate', 'Advanced'][difficulty - 1]
  const readableName = subSkill
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace(/1v1/g, '1v1')
    .trim()
  return `${readableName} — ${diffLabel}`
}

function generateExerciseDescription(subSkill, difficulty, category, methodology) {
  const reps = [10, 20, 30][difficulty - 1]
  const duration = [5, 10, 15][difficulty - 1]
  const methodSource = {
    coerver: 'Coerver Coaching method',
    horstWein: 'Horst Wein small-sided games',
    danAbrahams: 'Dan Abrahams 4C model',
    talentCode: 'Deep Practice (Talent Code)',
    uefa: 'UEFA youth development',
  }[methodology] || methodology

  return `Practice ${subSkill.replace(/([A-Z])/g, ' $1').toLowerCase()} for ${duration} minutes. ${reps} reps per set. Based on ${methodSource}.`
}

// ── Validation ──────────────────────────────────────────────

function validateExercise(ex) {
  if (!ex.id || !ex.nameEn || !ex.descEn) return false
  if (!ex.category || !ex.subSkill) return false
  if (!ex.difficulty || ex.difficulty < 1 || ex.difficulty > 5) return false
  if (!ex.durationMinutes || ex.durationMinutes < 1) return false
  if (!Array.isArray(ex.equipment)) return false
  return true
}

// ── Helpers ─────────────────────────────────────────────────

function getCuratedExerciseIds(config) {
  const filePath = path.join(config.srcDir, 'data', 'exercises.ts')
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const ids = []
  const regex = /id:\s*'([^']+)'/g
  let match
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[1])
  }
  return ids
}

function getExerciseEnglishName(config, id) {
  // Read English i18n file and look up the name key
  const enPath = path.join(config.i18nDir, 'en.json')
  if (!fs.existsSync(enPath)) return null
  try {
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'))
    // Find the key pattern: ex.{category}.{name}
    for (const [key, value] of Object.entries(enData)) {
      if (key.startsWith('ex.') && !key.endsWith('.desc')) {
        // Check if this key maps to the exercise ID
        // The mapping pattern: tech-01 → ex.tech.juggling, phys-01 → ex.phys.agilityCourse etc.
        // We need to find by matching the exercise data, but we only have the ID
        // So let's match all names and return by index
      }
    }
    // Simpler: read exercises.ts and find the nameKey for the given ID
    const exercisesPath = path.join(config.srcDir, 'data', 'exercises.ts')
    const content = fs.readFileSync(exercisesPath, 'utf-8')
    const idRegex = new RegExp(`id:\\s*'${id}'[^}]*?nameKey:\\s*'([^']+)'`, 's')
    const match = content.match(idRegex)
    if (match) {
      const nameKey = match[1]
      return enData[nameKey] || null
    }
  } catch { /* ignore */ }
  return null
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { name, run }
