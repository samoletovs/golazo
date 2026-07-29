import { describe, it, expect } from 'vitest'

describe('exercises data integrity', () => {
  it('all curated exercises have unique IDs', async () => {
    const { exercises } = await import('../src/data/exercises')
    const ids = exercises.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all curated exercises have required fields', async () => {
    const { exercises } = await import('../src/data/exercises')
    for (const ex of exercises) {
      expect(ex.id, `exercise missing id`).toBeTruthy()
      expect(ex.nameKey, `${ex.id} missing nameKey`).toBeTruthy()
      expect(ex.descriptionKey, `${ex.id} missing descriptionKey`).toBeTruthy()
      expect(ex.category, `${ex.id} missing category`).toBeTruthy()
      expect(ex.difficulty, `${ex.id} missing difficulty`).toBeGreaterThanOrEqual(1)
      expect(ex.difficulty, `${ex.id} difficulty out of range`).toBeLessThanOrEqual(5)
      expect(ex.durationMinutes, `${ex.id} missing durationMinutes`).toBeGreaterThan(0)
      expect(Array.isArray(ex.equipment), `${ex.id} equipment must be array`).toBe(true)
    }
  })

  it('has at least 20 curated exercises', async () => {
    const { exercises } = await import('../src/data/exercises')
    expect(exercises.length).toBeGreaterThanOrEqual(20)
  })
})

describe('UserDrill type', () => {
  it('UserDrill interface has required fields', async () => {
    // Verify the type is exported from types.ts by importing and checking
    const typesSource = await import('fs').then(fs =>
      fs.readFileSync('src/engine/types.ts', 'utf-8')
    )
    expect(typesSource).toContain('export interface UserDrill')
    expect(typesSource).toContain('id: string')
    expect(typesSource).toContain('name: string')
    expect(typesSource).toContain('description: string')
    expect(typesSource).toContain('category: SkillCategory')
    expect(typesSource).toContain('difficulty: 1 | 2 | 3 | 4 | 5')
    expect(typesSource).toContain('durationMinutes: number')
    expect(typesSource).toContain('submittedAt: string')
  })

  it('Exercise source type includes community', async () => {
    const typesSource = await import('fs').then(fs =>
      fs.readFileSync('src/engine/types.ts', 'utf-8')
    )
    expect(typesSource).toContain("'community'")
  })
})

describe('userDrills state management', () => {
  it('AppContext exposes addUserDrill and deleteUserDrill', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/contexts/AppContext.tsx', 'utf-8')
    )
    expect(source).toContain('addUserDrill')
    expect(source).toContain('deleteUserDrill')
  })

  it('AppContext includes userDrills in default state', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/contexts/AppContext.tsx', 'utf-8')
    )
    expect(source).toContain('userDrills: []')
  })

  it('AppContext merges userDrills on cloud sync', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/contexts/AppContext.tsx', 'utf-8')
    )
    expect(source).toContain('merged.userDrills')
  })

  it('addUserDrill appends to userDrills array', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/contexts/AppContext.tsx', 'utf-8')
    )
    expect(source).toContain('userDrills: [...state.userDrills, d]')
  })

  it('deleteUserDrill filters out by id', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/contexts/AppContext.tsx', 'utf-8')
    )
    expect(source).toContain('userDrills: state.userDrills.filter(d => d.id !== id)')
  })
})

describe('Exercises page community drill support', () => {
  it('Exercises page imports UserDrill type', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/pages/Exercises.tsx', 'utf-8')
    )
    expect(source).toContain('UserDrill')
  })

  it('Exercises page shows community badge for user drills', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/pages/Exercises.tsx', 'utf-8')
    )
    expect(source).toContain("source === 'community'")
    expect(source).toContain('exercises.communityBadge')
  })

  it('Exercises page has submit drill button', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/pages/Exercises.tsx', 'utf-8')
    )
    expect(source).toContain('exercises.submitDrill.cta')
    expect(source).toContain('SubmitDrillModal')
  })

  it('Exercises page merges user drills with curated exercises', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/pages/Exercises.tsx', 'utf-8')
    )
    expect(source).toContain('communityExercises')
    expect(source).toContain('allExercises')
    expect(source).toContain('userDrillToExercise')
  })

  it('Exercises page supports filtering by skill level', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/pages/Exercises.tsx', 'utf-8')
    )
    expect(source).toContain('skillLevel')
    expect(source).toContain("e.difficulty === skillLevel")
    expect(source).toContain('exercises.skillLevel')
  })

  it('Exercises page labels category chips as training focus', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('src/pages/Exercises.tsx', 'utf-8')
    )
    expect(source).toContain('exercises.trainingFocus')
  })
})
