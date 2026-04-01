/**
 * i18n Completeness — Maintenance Task
 *
 * Compares all language files against English (en.json) as reference.
 * Reports missing keys per language and overall coverage percentage.
 * Flags as error if any language drops below 90% coverage.
 */

const fs = require('fs')
const path = require('path')

const name = 'i18n-completeness'

const LANGUAGES = ['ru', 'lv', 'es', 'et', 'lt']
const REFERENCE_LANG = 'en'
const COVERAGE_THRESHOLD = 0.90

/** Flatten nested JSON keys into dot-notation paths */
function flattenKeys(obj, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

async function run(config) {
  const result = { added: 0, updated: 0, skipped: 0, errors: [] }

  // Load reference language
  const refPath = path.join(config.i18nDir, `${REFERENCE_LANG}.json`)
  if (!fs.existsSync(refPath)) {
    result.errors.push(`Reference language file ${REFERENCE_LANG}.json not found`)
    return result
  }

  let refData
  try {
    refData = JSON.parse(fs.readFileSync(refPath, 'utf-8'))
  } catch (err) {
    result.errors.push(`Failed to parse ${REFERENCE_LANG}.json: ${err.message}`)
    return result
  }

  const refKeys = flattenKeys(refData)
  const refKeySet = new Set(refKeys)
  console.log(`│  Reference (${REFERENCE_LANG}): ${refKeys.length} keys`)

  let allAboveThreshold = true

  for (const lang of LANGUAGES) {
    const langPath = path.join(config.i18nDir, `${lang}.json`)
    if (!fs.existsSync(langPath)) {
      result.errors.push(`Language file ${lang}.json not found`)
      continue
    }

    let langData
    try {
      langData = JSON.parse(fs.readFileSync(langPath, 'utf-8'))
    } catch (err) {
      result.errors.push(`Failed to parse ${lang}.json: ${err.message}`)
      continue
    }

    const langKeys = new Set(flattenKeys(langData))
    const missing = refKeys.filter(k => !langKeys.has(k))
    const extra = [...langKeys].filter(k => !refKeySet.has(k))
    const coverage = refKeys.length > 0 ? (refKeys.length - missing.length) / refKeys.length : 1

    const pct = (coverage * 100).toFixed(1)
    const status = coverage >= COVERAGE_THRESHOLD ? '✓' : '⚠'
    console.log(`│  ${status} ${lang}: ${langKeys.size} keys, ${pct}% coverage (${missing.length} missing${extra.length > 0 ? `, ${extra.length} extra` : ''})`)

    if (missing.length > 0 && config.verbose) {
      const shown = missing.slice(0, 10)
      for (const key of shown) {
        console.log(`│      missing: ${key}`)
      }
      if (missing.length > 10) {
        console.log(`│      ... and ${missing.length - 10} more`)
      }
    }

    if (coverage < COVERAGE_THRESHOLD) {
      allAboveThreshold = false
      result.errors.push(`${lang}: ${pct}% coverage (below ${(COVERAGE_THRESHOLD * 100).toFixed(0)}% threshold, ${missing.length} keys missing)`)
    }

    result.updated++
  }

  if (allAboveThreshold) {
    console.log(`│  All languages above ${(COVERAGE_THRESHOLD * 100).toFixed(0)}% threshold`)
  }

  return result
}

module.exports = { name, run }
