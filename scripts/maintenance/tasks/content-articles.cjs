/**
 * Content Articles Maintenance Task
 *
 * Adds new educational articles to the Learn section and translates them
 * into all 6 supported languages (en, ru, lv, es, et, lt).
 *
 * How it works:
 *   1. Reads a content-queue.json file from data/ (manually curated topic list)
 *   2. For each queued topic, generates article text from the topic brief
 *   3. Inserts the article into src/data/articles.ts
 *   4. Adds i18n keys (title + body) to all 6 language files
 *   5. Marks the topic as "published" in the queue file
 *
 * Content-queue.json format:
 *   [{ "id": "art-tac-06", "category": "tactics", "ageTiers": ["u12","u14","u16"],
 *      "readingTimeMin": 2, "emoji": "🏃", "status": "queued",
 *      "en": { "title": "...", "body": "..." },
 *      "ru": { "title": "...", "body": "..." },
 *      ... }]
 *
 * Usage:
 *   node scripts/maintenance/maintain.cjs --task content-articles              # publish all queued
 *   node scripts/maintenance/maintain.cjs --task content-articles --dry-run    # preview
 *
 * To add content:
 *   1. Add entries to data/content-queue.json with status: "queued"
 *   2. Run this task to publish them into the app
 *
 * Designed for VS Code Copilot to generate the queue entries (AI writes the
 * content + translations, this script injects them into the codebase).
 */

const fs = require('fs')
const path = require('path')

const LANGUAGES = ['en', 'ru', 'lv', 'es', 'et', 'lt']

const name = 'content-articles'

/**
 * @param {import('../config.cjs')} config
 * @returns {Promise<{added: number, updated: number, skipped: number, errors: string[]}>}
 */
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
    console.log('  No queued articles — all published')
    return result
  }

  console.log(`  Found ${queued.length} queued article(s)`)

  // Validate each entry before doing anything
  for (const item of queued) {
    const problems = validateEntry(item)
    if (problems.length > 0) {
      result.errors.push(`${item.id}: ${problems.join(', ')}`)
      result.skipped++
    }
  }
  if (result.errors.length > 0 && !config.dryRun) {
    console.log('  ⚠ Validation errors found, fixing valid entries only')
  }

  const valid = queued.filter(item => validateEntry(item).length === 0)
  if (valid.length === 0) {
    console.log('  No valid entries to publish')
    return result
  }

  if (config.dryRun) {
    console.log(`  Would publish ${valid.length} article(s):`)
    for (const item of valid) {
      console.log(`    ${item.id} [${item.category}] — ${item.en.title.slice(0, 60)}...`)
    }
    result.added = valid.length
    return result
  }

  // ── 1. Update articles.ts ──
  const articlesPath = path.join(config.srcDir, 'data', 'articles.ts')
  let articlesSource = fs.readFileSync(articlesPath, 'utf-8')

  for (const item of valid) {
    const i18nKey = item.id.replace(/-/g, '').replace('art', 'art.')
    const entry = buildArticleEntry(item, i18nKey)

    // Insert before the closing bracket
    articlesSource = articlesSource.replace(
      /\n\]\s*$/,
      `\n${entry}\n]\n`
    )
    console.log(`  ✓ Added ${item.id} to articles.ts`)
  }

  fs.writeFileSync(articlesPath, articlesSource, 'utf-8')

  // ── 2. Update all i18n files ──
  for (const lang of LANGUAGES) {
    const i18nPath = path.join(config.i18nDir, `${lang}.json`)
    if (!fs.existsSync(i18nPath)) {
      result.errors.push(`Missing i18n file: ${lang}.json`)
      continue
    }

    const i18nData = JSON.parse(fs.readFileSync(i18nPath, 'utf-8'))

    for (const item of valid) {
      const i18nKey = item.id.replace(/-/g, '').replace('art', 'art.')
      const titleKey = `${i18nKey}.title`
      const bodyKey = `${i18nKey}.body`

      // Use the language-specific content, fall back to English
      const langData = item[lang] || item.en
      i18nData[titleKey] = langData.title
      i18nData[bodyKey] = langData.body
    }

    fs.writeFileSync(i18nPath, JSON.stringify(i18nData, null, 2) + '\n', 'utf-8')
    console.log(`  ✓ Updated ${lang}.json (+${valid.length * 2} keys)`)
  }

  // ── 3. Mark as published ──
  for (const item of valid) {
    item.status = 'published'
    item.publishedAt = new Date().toISOString()
    result.added++
  }

  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + '\n', 'utf-8')
  console.log(`  ✓ Marked ${valid.length} article(s) as published`)

  return result
}

function buildArticleEntry(item, i18nKey) {
  const tiers = JSON.stringify(item.ageTiers)
  return `  {
    id: '${item.id}',
    titleKey: '${i18nKey}.title',
    bodyKey: '${i18nKey}.body',
    category: '${item.category}',
    ageTiers: ${tiers},
    readingTimeMin: ${item.readingTimeMin || 2},
    imageEmoji: '${item.emoji || '📄'}',
  },`
}

function validateEntry(item) {
  const problems = []
  if (!item.id) problems.push('missing id')
  if (!item.category) problems.push('missing category')
  if (!item.ageTiers || !Array.isArray(item.ageTiers)) problems.push('missing ageTiers')
  if (!item.en) problems.push('missing en translation')
  if (item.en && !item.en.title) problems.push('missing en.title')
  if (item.en && !item.en.body) problems.push('missing en.body')
  // Check all languages have content (warn, don't block)
  for (const lang of LANGUAGES) {
    if (lang === 'en') continue
    if (!item[lang]) problems.push(`missing ${lang} translation`)
  }
  return problems
}

module.exports = { name, run }
