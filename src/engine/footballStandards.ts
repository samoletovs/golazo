export interface MatchDurationRecommendation {
  age: number | null
  ageBand: 'u10' | 'u12' | 'u14' | 'u16' | 'u18plus'
  halfMinutes: number
  totalMinutes: number
}

function getAgeFromBirthDate(birthDate?: string): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1
  }
  return age < 0 ? null : age
}

/**
 * IFAB Law 7 defines 2x45 as the default match format and allows competition
 * rules to set shorter periods. This helper provides youth-friendly defaults.
 */
export function getMatchDurationRecommendation(birthDate?: string): MatchDurationRecommendation {
  const age = getAgeFromBirthDate(birthDate)

  if (age !== null && age <= 10) {
    return { age, ageBand: 'u10', halfMinutes: 25, totalMinutes: 50 }
  }
  if (age !== null && age <= 12) {
    return { age, ageBand: 'u12', halfMinutes: 30, totalMinutes: 60 }
  }
  if (age !== null && age <= 14) {
    return { age, ageBand: 'u14', halfMinutes: 35, totalMinutes: 70 }
  }
  if (age !== null && age <= 16) {
    return { age, ageBand: 'u16', halfMinutes: 40, totalMinutes: 80 }
  }

  return { age, ageBand: 'u18plus', halfMinutes: 45, totalMinutes: 90 }
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hoursRaw, minsRaw] = time.split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minsRaw)
  const startTotal = (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
  const endTotal = (startTotal + minutesToAdd) % (24 * 60)
  const endHours = Math.floor(endTotal / 60)
  const endMinutes = endTotal % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}
