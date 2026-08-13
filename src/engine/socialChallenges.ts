import type { SocialChallenge, SocialChallengeParticipant } from './types'

/** Length of the share code used to join a social challenge */
export const SOCIAL_CHALLENGE_CODE_LENGTH = 6

/** Limits mirrored by the API so the UI can validate before sending */
export const SOCIAL_CHALLENGE_LIMITS = {
  titleMaxLength: 80,
  minTarget: 1,
  maxTarget: 50,
  minDays: 1,
  maxDays: 31,
} as const

/** Uppercase and strip everything that is not part of a share code */
export function normalizeJoinCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, SOCIAL_CHALLENGE_CODE_LENGTH)
}

export function isValidJoinCode(input: string): boolean {
  return normalizeJoinCode(input).length === SOCIAL_CHALLENGE_CODE_LENGTH
}

/** Participants ordered by progress (highest first), ties broken by name */
export function rankParticipants(challenge: SocialChallenge): SocialChallengeParticipant[] {
  return [...challenge.participants].sort(
    (a, b) => b.progress - a.progress || a.name.localeCompare(b.name),
  )
}

/** Progress as a 0–100 percentage, clamped for display */
export function challengeProgressPercent(progress: number, target: number): number {
  if (target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((progress / target) * 100)))
}

export function isChallengeExpired(challenge: SocialChallenge, now: Date = new Date()): boolean {
  return new Date(challenge.endsAt).getTime() <= now.getTime()
}

/** A challenge is complete once any participant reaches the target */
export function isChallengeComplete(challenge: SocialChallenge): boolean {
  return challenge.participants.some((p) => p.progress >= challenge.target)
}

export type SocialChallengeStatus = 'active' | 'completed' | 'expired'

export function getChallengeStatus(challenge: SocialChallenge, now: Date = new Date()): SocialChallengeStatus {
  if (isChallengeComplete(challenge)) return 'completed'
  if (isChallengeExpired(challenge, now)) return 'expired'
  return 'active'
}

export function findParticipant(
  challenge: SocialChallenge,
  userId: string,
): SocialChallengeParticipant | undefined {
  return challenge.participants.find((p) => p.userId === userId)
}
