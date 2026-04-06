import { describe, it, expect } from 'vitest'

/**
 * Tests for data sync completeness.
 * Ensures every field in AppState is included in the sync payload
 * and the API handles it in both GET and PUT directions.
 * 
 * These tests would have caught the critical bug where:
 * - syncToApi was never called automatically
 * - recurringTrainings was missing from the sync API
 * - onboardingComplete was not synced
 */

// The canonical list of ALL AppState fields that must be synced
const APP_STATE_FIELDS = [
  'profile',
  'xp',
  'skillTree',
  'trainings',
  'matches',
  'tournaments',
  'diary',
  'schedule',
  'recurringTrainings',
  'specialChallenges',
  'physicalProfile',
  'checkIns',
  'quizAnswers',
  'readArticles',
  'savedExercises',
  'programProgress',
  'onboardingComplete',
] as const

// Fields that are arrays of objects with IDs
const ARRAY_FIELDS = [
  'trainings',
  'matches',
  'tournaments',
  'diary',
  'schedule',
  'recurringTrainings',
  'specialChallenges',
  'checkIns',
  'quizAnswers',
  'readArticles',
  'programProgress',
]

// Fields that are single objects (not arrays)
const OBJECT_FIELDS = [
  'profile',
  'xp',
  'skillTree',
  'physicalProfile',
]

describe('Sync payload completeness', () => {
  it('syncToApi includes all AppState fields', async () => {
    // Read the actual syncToApi function source to verify all fields
    const fs = await import('fs')
    const source = fs.readFileSync('src/contexts/AppContext.tsx', 'utf-8')
    
    // Extract the JSON.stringify block from syncToApi
    const syncMatch = source.match(/body: JSON\.stringify\(\{([^}]+)\}\)/)
    expect(syncMatch).toBeTruthy()
    const syncPayload = syncMatch![1]
    
    for (const field of APP_STATE_FIELDS) {
      expect(
        syncPayload.includes(field),
        `syncToApi is MISSING field '${field}' — this will cause data loss!`
      ).toBe(true)
    }
  })

  it('sync API GET handler returns all AppState fields', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('api/src/functions/sync.js', 'utf-8')
    
    // Check the state object in handleGet
    const stateMatch = source.match(/const state = \{([^}]+)\}/)
    expect(stateMatch).toBeTruthy()
    const stateInit = stateMatch![1]
    
    for (const field of APP_STATE_FIELDS) {
      expect(
        stateInit.includes(field),
        `sync.js GET is MISSING field '${field}' in state object — data will be lost on cloud read!`
      ).toBe(true)
    }
  })

  it('sync API PUT handler validates all array fields', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('api/src/functions/sync.js', 'utf-8')
    
    // Check arrayFieldKeys includes all array fields
    const validationMatch = source.match(/const arrayFieldKeys = \[([^\]]+)\]/)
    expect(validationMatch).toBeTruthy()
    const validationList = validationMatch![1]
    
    for (const field of ARRAY_FIELDS) {
      expect(
        validationList.includes(`'${field}'`),
        `sync.js PUT validation is MISSING '${field}' — this field won't be validated or saved!`
      ).toBe(true)
    }
  })

  it('sync API PUT handler upserts all array fields', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('api/src/functions/sync.js', 'utf-8')
    
    // Check arrayFields mapping includes recurring trainings
    expect(source).toContain("key: 'recurringTrainings'")
    expect(source).toContain("type: 'recurringTraining'")
  })

  it('sync API handles onboardingComplete in both directions', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('api/src/functions/sync.js', 'utf-8')
    
    // GET: must have case for onboardingComplete
    expect(source).toContain("case 'onboardingComplete':")
    
    // PUT: must upsert onboardingComplete
    expect(source).toContain("docType: 'onboardingComplete'")
  })
})

describe('Auto-sync mechanism', () => {
  it('update() function triggers auto-sync', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('src/contexts/AppContext.tsx', 'utf-8')
    
    // The update() function must call syncToApi
    // Look for setTimeout + syncToApi in the update function
    expect(
      source.includes('syncToApi(next)'),
      'update() must auto-sync to cloud — without this, data only saves to localStorage!'
    ).toBe(true)
    
    // Verify it's debounced (not on every keystroke)
    expect(
      source.includes('setTimeout'),
      'Auto-sync should be debounced to avoid excessive API calls'
    ).toBe(true)
  })

  it('syncFromApi is called on mount', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('src/contexts/AppContext.tsx', 'utf-8')
    
    expect(
      source.includes('syncFromApi()'),
      'App must fetch data from cloud on mount'
    ).toBe(true)
  })
})

describe('Merge logic preserves data', () => {
  it('merge prefers remote data when available', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('src/contexts/AppContext.tsx', 'utf-8')
    
    // All important array fields should be in the merge logic
    for (const field of ['checkIns', 'trainings', 'matches', 'schedule', 'recurringTrainings']) {
      expect(
        source.includes(`merged.${field}`),
        `Merge logic must handle '${field}' to prevent data loss`
      ).toBe(true)
    }
  })
})

describe('Logout preserves logged-out state', () => {
  it('logout sets logged-out flag', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8')
    
    expect(source).toContain('golazo-logged-out')
    expect(source).toContain("setItem('golazo-logged-out'")
  })

  it('login clears logged-out flag', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8')
    
    expect(source).toContain("removeItem('golazo-logged-out'")
  })

  it('auth check respects logged-out flag', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8')
    
    expect(source).toContain("getItem('golazo-logged-out'")
  })
})
