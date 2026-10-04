import { describe, expect, it } from 'vitest'
import en from '../src/i18n/en.json'
import et from '../src/i18n/et.json'
import lt from '../src/i18n/lt.json'

const repairedScopes = ['teamChallenges.', 'socialChallenges.', 'mentor.', 'coach.']
const repairedKeys = new Set([
  'nav.squads', 'nav.stats', 'common.done', 'common.link', 'common.search',
  'player.announcements', 'player.evaluations', 'login.asCoach', 'login.coachDesc',
  'profile.switchRole', 'teams.club', 'teams.academy', 'teams.squad', 'teams.squads',
  'teams.parentClub', 'teams.siblingSquads', 'teams.birthYear', 'teams.squadLabel',
  'teams.noSquads', 'teams.viewClub',
])
const repairedEntries = Object.entries(en).filter(([key]) =>
  repairedKeys.has(key) || repairedScopes.some((scope) => key.startsWith(scope)),
)
const placeholders = (value: string) => (value.match(/\{\{[^{}]+\}\}/g) ?? []).sort()

describe.each([
  ['Estonian', et],
  ['Lithuanian', lt],
] as const)('%s maintenance locale coverage', (_name, translations) => {
  const locale: Record<string, string> = translations

  it('covers every English key', () => {
    expect(Object.keys(en).filter((key) => !Object.hasOwn(locale, key))).toEqual([])
  })

  it.each(repairedEntries)('preserves interpolation placeholders for %s', (key, english) => {
    expect(locale[key]).toBeTypeOf('string')
    expect(locale[key].trim()).not.toBe('')
    expect(placeholders(locale[key])).toEqual(placeholders(english))
  })
})
