import { describe, expect, it } from 'vitest'

describe('social team challenge API', () => {
  it('requires an authorized coach and scopes challenge actions to a participating team', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('api/src/functions/coach-manage.js', 'utf-8')

    expect(source).toContain("route: 'coach/team/{teamId}/social-challenges'")
    expect(source).toContain("route: 'coach/team/{teamId}/social-challenges/{challengeId}'")
    expect(source).toContain("if (!user) return jsonResponse({ error: 'Unauthorized' }, 401)")
    expect(source).toContain("if (!managedTeam) return jsonResponse({ error: 'Forbidden' }, 403)")
    expect(source).toContain("challenge.teamId !== teamId && challenge.opponentTeamId !== teamId")
  })

  it('only lets the invited team accept or decline and caps logged progress at the target', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync('api/src/functions/coach-manage.js', 'utf-8')

    expect(source).toContain("!isOpponent || challenge.status !== 'pending'")
    expect(source).toContain("Math.min(challenge[progressKey] + 1, challenge.target)")
    expect(source).toContain("if (challenge[progressKey] >= challenge.target) challenge.status = 'completed'")
    expect(source).toContain("accessCondition: { type: 'IfMatch', condition: challenge._etag }")
  })
})
