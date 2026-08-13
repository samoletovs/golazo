import { describe, expect, it } from 'vitest'
import {
  challengeProgressPercent,
  findParticipant,
  getChallengeStatus,
  isValidJoinCode,
  normalizeJoinCode,
  rankParticipants,
} from '../src/engine/socialChallenges'
import type { SocialChallenge } from '../src/engine/types'

function makeChallenge(overrides: Partial<SocialChallenge> = {}): SocialChallenge {
  return {
    id: 'friendChallenge:u1:1',
    code: 'ABC123',
    title: '20 juggles a day',
    target: 5,
    unit: 'sessions',
    createdBy: 'u1',
    createdByName: 'Sam',
    createdAt: '2024-01-01T00:00:00.000Z',
    endsAt: '2024-01-08T00:00:00.000Z',
    participants: [
      { userId: 'u1', name: 'Sam', progress: 1 },
      { userId: 'u2', name: 'Alex', progress: 3 },
    ],
    ...overrides,
  }
}

describe('social challenge join codes', () => {
  it('normalizes user input to a 6-character uppercase code', () => {
    expect(normalizeJoinCode(' abc-123 ')).toBe('ABC123')
    expect(normalizeJoinCode('abc123456')).toBe('ABC123')
    expect(isValidJoinCode('abc12')).toBe(false)
    expect(isValidJoinCode('abc-123')).toBe(true)
  })
})

describe('social challenge progress', () => {
  it('clamps the progress percentage between 0 and 100', () => {
    expect(challengeProgressPercent(0, 5)).toBe(0)
    expect(challengeProgressPercent(2, 5)).toBe(40)
    expect(challengeProgressPercent(9, 5)).toBe(100)
    expect(challengeProgressPercent(1, 0)).toBe(0)
  })

  it('ranks participants by progress then name', () => {
    const ranked = rankParticipants(
      makeChallenge({
        participants: [
          { userId: 'u1', name: 'Sam', progress: 2 },
          { userId: 'u2', name: 'Alex', progress: 2 },
          { userId: 'u3', name: 'Nina', progress: 4 },
        ],
      }),
    )
    expect(ranked.map((p) => p.userId)).toEqual(['u3', 'u2', 'u1'])
  })

  it('reports completed, expired and active states', () => {
    const now = new Date('2024-01-03T00:00:00.000Z')
    expect(getChallengeStatus(makeChallenge(), now)).toBe('active')
    expect(
      getChallengeStatus(
        makeChallenge({ participants: [{ userId: 'u2', name: 'Alex', progress: 5 }] }),
        now,
      ),
    ).toBe('completed')
    expect(getChallengeStatus(makeChallenge({ endsAt: '2024-01-02T00:00:00.000Z' }), now)).toBe('expired')
  })

  it('finds the signed-in participant', () => {
    expect(findParticipant(makeChallenge(), 'u2')?.name).toBe('Alex')
    expect(findParticipant(makeChallenge(), 'unknown')).toBeUndefined()
  })
})

describe('social challenge API', () => {
  it('requires authentication and exposes create, join and progress routes', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('api/src/functions/social-challenges.js', 'utf-8')

    expect(source).toContain("route: 'social-challenges'")
    expect(source).toContain("route: 'social-challenges/join'")
    expect(source).toContain("route: 'social-challenges/{challengeId}/progress'")
    expect(source.match(/if \(!user\) return jsonResponse\(\{ error: 'Unauthorized' \}, 401\)/g)?.length).toBe(3)
  })

  it('only lets participants log progress, caps it at the target and guards concurrent writes', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('api/src/functions/social-challenges.js', 'utf-8')

    expect(source).toContain("if (!participant) return jsonResponse({ error: 'Forbidden' }, 403)")
    expect(source).toContain('Math.min(participant.progress + 1, challenge.target)')
    expect(source).toContain("accessCondition: { type: 'IfMatch', condition: challenge._etag }")
    expect(source).toContain('ARRAY_CONTAINS(c.participantIds, @userId)')
  })
})
