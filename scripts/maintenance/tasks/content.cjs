/**
 * Unified Content Publisher — maintenance task
 *
 * Publishes ALL content types from a single data/content-queue.json file:
 *
 *   ┌─────────────┬──────────────────────────────────────────────┐
 *   │ type        │ what it adds                                 │
 *   ├─────────────┼──────────────────────────────────────────────┤
 *   │ article     │ Learn section articles (tactics, nutrition…) │
 *   │ quiz        │ Daily quiz questions                         │
 *   │ quote       │ Motivational player quotes                   │
 *   │ exercise    │ Training drill cards                         │
 *   │ program     │ Multi-week training programs                 │
 *   │ challenge   │ Daily / special challenges                   │
 *   └─────────────┴──────────────────────────────────────────────┘
 *
 * Queue format — each item has "type" + type-specific fields:
 *
 *   { "type": "article",  "id": "art-tac-06", "status": "queued", ... }
 *   { "type": "quiz",     "id": "u12-tac-99", "status": "queued", ... }
 *   { "type": "quote",    "id": "haaland-1",  "status": "queued", ... }
 *   { "type": "exercise", "id": "tech-10",    "status": "queued", ... }
 *
 * Usage:
 *   node scripts/maintenance/maintain.cjs --task content           # publish all queued
 *   node scripts/maintenance/maintain.cjs --task content --dry-run # preview
 *
 * This replaces the old content-articles task (which still works for backward compat).
 */

const fs = require('fs')
const path = require('path')

const LANGUAGES = ['en', 'ru', 'lv', 'es', 'et', 'lt']
const name = 'content'

async function run(config) {
  const result = { added: 0, updated: 0, skipped: 0, errors: [] }

  const queuePath = path.join(config.dataDir, 'content-queue.json')
  if (!fs.existsSync(queuePath)) {
    console.log('  No content-queue.json found — nothing to publish')
    return result
  }

  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf-8'))
  const queued = queue.filter(item => item.status === 'queued')

  if (queued.length === 0) {
    console.log('  No queued content — all published')
    return result
  }

  // Group by type
  const byType = {}
  for (const item of queued) {
    const t = item.type || 'article' // backward compat: no type = article
    if (!byType[t]) byType[t] = []
    byType[t].push(item)
  }

  const summary = Object.entries(byType).map(([t, items]) => `${items.length} ${t}(s)`).join(', ')
  console.log(`  Found ${queued.length} queued items: ${summary}`)

  // Validate
  for (const item of queued) {
    const problems = validate(item)
    if (problems.length > 0) {
      result.errors.push(`${item.id}: ${problems.join(', ')}`)
      result.skipped++
    }
  }

  const valid = queued.filter(item => validate(item).length === 0)
  if (valid.length === 0) {
    console.log('  No valid entries to publish')
    return result
  }

  if (config.dryRun) {
    console.log(`  Would publish ${valid.length} item(s):`)
    for (const item of valid) {
      const t = item.type || 'article'
      const label = item.en?.title || item.en?.question || item.en?.text || item.id
      console.log(`    [${t}] ${item.id} — ${String(label).slice(0, 60)}`)
    }
    result.added = valid.length
    return result
  }

  // ── Process each type ──
  const validByType = {}
  for (const item of valid) {
    const t = item.type || 'article'
    if (!validByType[t]) validByType[t] = []
    validByType[t].push(item)
  }

  if (validByType.article) publishArticles(validByType.article, config, result)
  if (validByType.quiz) publishQuizzes(validByType.quiz, config, result)
  if (validByType.quote) publishQuotes(validByType.quote, config, result)
  if (validByType.exercise) publishExercises(validByType.exercise, config, result)

  // ── Mark all as published ──
  for (const item of valid) {
    item.status = 'published'
    item.publishedAt = new Date().toISOString()
    result.added++
  }

  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + '\n', 'utf-8')
  console.log(`  ✓ Marked ${valid.length} item(s) as published`)

  return result
}

// ═══════════════════════════════════════════════════════════
//  ARTICLES — insert into articles.ts + i18n files
// ═══════════════════════════════════════════════════════════
function publishArticles(items, config, result) {
  const filePath = path.join(config.srcDir, 'data', 'articles.ts')
  let source = fs.readFileSync(filePath, 'utf-8')

  for (const item of items) {
    const i18nKey = item.id.replace(/-/g, '').replace('art', 'art.')
    source = source.replace(
      /\n\]\s*$/,
      `\n  {\n    id: '${item.id}',\n    titleKey: '${i18nKey}.title',\n    bodyKey: '${i18nKey}.body',\n    category: '${item.category}',\n    ageTiers: ${JSON.stringify(item.ageTiers)},\n    readingTimeMin: ${item.readingTimeMin || 2},\n    imageEmoji: '${item.emoji || '📄'}',\n  },\n]\n`
    )
    addI18nKeys(config, i18nKey, item, ['title', 'body'])
    console.log(`  ✓ article: ${item.id}`)
  }

  fs.writeFileSync(filePath, source, 'utf-8')
}

// ═══════════════════════════════════════════════════════════
//  QUIZZES — insert into quizzes.ts (plain text, no i18n yet)
// ═══════════════════════════════════════════════════════════
function publishQuizzes(items, config, result) {
  const filePath = path.join(config.srcDir, 'data', 'quizzes.ts')
  let source = fs.readFileSync(filePath, 'utf-8')

  for (const item of items) {
    // Quiz questions are still plain English text (matching existing pattern)
    const opts = JSON.stringify(item.options)
    const entry = `  { id: '${item.id}', questionKey: '${escapeTs(item.en.question)}', options: ${opts}, correctIndex: ${item.correctIndex}, category: '${item.category}', difficulty: '${item.difficulty}' },`

    // Insert before the closing bracket of the quizQuestions array
    source = source.replace(
      /\n\]\s*\n\n\/\*\* Get today/,
      `\n${entry}\n]\n\n/** Get today`
    )
    console.log(`  ✓ quiz: ${item.id}`)
  }

  fs.writeFileSync(filePath, source, 'utf-8')
}

// ═══════════════════════════════════════════════════════════
//  QUOTES — insert into quotes.ts (already multi-language)
// ═══════════════════════════════════════════════════════════
function publishQuotes(items, config, result) {
  const filePath = path.join(config.srcDir, 'data', 'quotes.ts')
  let source = fs.readFileSync(filePath, 'utf-8')

  for (const item of items) {
    const themes = JSON.stringify(item.themes || ['motivation'])
    const textObj = LANGUAGES.map(lang => {
      const t = (item[lang] && item[lang].text) || item.en.text
      return `      ${lang}: '${escapeTs(t)}',`
    }).join('\n')

    const entry = `  {\n    id: '${item.id}',\n    player: '${escapeTs(item.player)}',\n    themes: ${themes},\n    text: {\n${textObj}\n    },\n  },`

    // Insert before the closing bracket
    source = source.replace(
      /\n\]\s*\n\n\/\*\*/,
      `\n${entry}\n]\n\n/**`
    )
    // Fallback: try simpler pattern
    if (!source.includes(item.id)) {
      source = source.replace(
        /\n\]\s*$/,
        `\n${entry}\n]\n`
      )
    }
    console.log(`  ✓ quote: ${item.id} (${item.player})`)
  }

  fs.writeFileSync(filePath, source, 'utf-8')
}

// ═══════════════════════════════════════════════════════════
//  EXERCISES — insert into exercises.ts + i18n files
// ═══════════════════════════════════════════════════════════
function publishExercises(items, config, result) {
  const filePath = path.join(config.srcDir, 'data', 'exercises.ts')
  let source = fs.readFileSync(filePath, 'utf-8')

  for (const item of items) {
    const nameKey = `ex.${item.id.replace(/-/g, '.')}`
    const descKey = `${nameKey}.desc`
    const equip = JSON.stringify(item.equipment || ['ballOnly'])
    const positions = JSON.stringify(item.positions || [])

    const entry = `  {\n    id: '${item.id}', nameKey: '${nameKey}', descriptionKey: '${descKey}',\n    category: '${item.category}', subSkill: '${item.subSkill || 'ballControl'}', difficulty: ${item.difficulty || 2}, durationMinutes: ${item.durationMinutes || 10},\n    equipment: ${equip}, positions: ${positions}, methodology: '${item.methodology || 'coerver'}',\n  },`

    // Insert before the closing bracket of curatedExercises
    source = source.replace(
      /\n\]\s*\n\n\/\*\* All exercises/,
      `\n${entry}\n]\n\n/** All exercises`
    )

    // Add i18n keys: exercise name + description
    for (const lang of LANGUAGES) {
      const i18nPath = path.join(config.i18nDir, `${lang}.json`)
      if (!fs.existsSync(i18nPath)) continue
      const data = JSON.parse(fs.readFileSync(i18nPath, 'utf-8'))
      const langData = item[lang] || item.en
      data[nameKey] = langData.name
      data[descKey] = langData.desc
      fs.writeFileSync(i18nPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    }
    console.log(`  ✓ exercise: ${item.id}`)
  }

  fs.writeFileSync(filePath, source, 'utf-8')
}

// ═══════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════

/** Add i18n keys to all language files for a given prefix + fields */
function addI18nKeys(config, keyPrefix, item, fields) {
  for (const lang of LANGUAGES) {
    const i18nPath = path.join(config.i18nDir, `${lang}.json`)
    if (!fs.existsSync(i18nPath)) continue
    const data = JSON.parse(fs.readFileSync(i18nPath, 'utf-8'))
    const langData = item[lang] || item.en
    for (const field of fields) {
      data[`${keyPrefix}.${field}`] = langData[field]
    }
    fs.writeFileSync(i18nPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  }
}

function escapeTs(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

function validate(item) {
  const problems = []
  if (!item.id) problems.push('missing id')
  if (!item.en) problems.push('missing en')

  const t = item.type || 'article'

  if (t === 'article') {
    if (!item.category) problems.push('missing category')
    if (!item.ageTiers) problems.push('missing ageTiers')
    if (!item.en?.title) problems.push('missing en.title')
    if (!item.en?.body) problems.push('missing en.body')
  } else if (t === 'quiz') {
    if (!item.en?.question) problems.push('missing en.question')
    if (!item.options) problems.push('missing options')
    if (item.correctIndex == null) problems.push('missing correctIndex')
    if (!item.difficulty) problems.push('missing difficulty')
    if (!item.category) problems.push('missing category')
  } else if (t === 'quote') {
    if (!item.player) problems.push('missing player')
    if (!item.en?.text) problems.push('missing en.text')
  } else if (t === 'exercise') {
    if (!item.category) problems.push('missing category')
    if (!item.en?.name) problems.push('missing en.name')
    if (!item.en?.desc) problems.push('missing en.desc')
  }

  return problems
}

module.exports = { name, run }
