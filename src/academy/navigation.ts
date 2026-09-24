import type { AccountRole } from '../engine/types'
import type { AcademyIconName } from '../components/academy/AcademyIcon'

export const PAGES = ['dashboard', 'activity', 'log', 'learn', 'exercises', 'profile', 'settings', 'schedule', 'progress', 'leaderboard', 'challenges', 'portal', 'mentor', 'stats', 'coach-roster', 'coach-training', 'coach-announce', 'coach-evaluate', 'coach-attendance', 'coach-challenges'] as const
export type Page = typeof PAGES[number]

export function isPage(value: string): value is Page {
  return PAGES.some(page => page === value)
}

export interface NavigationItem {
  page: Page
  label: string
  icon: AcademyIconName
}

export function primaryNavigation(role: AccountRole = 'player'): NavigationItem[] {
  const home: NavigationItem = { page: 'dashboard', label: 'nav.dashboard', icon: 'home' }
  const profile: NavigationItem = { page: 'profile', label: 'nav.profile', icon: 'profile' }
  const schedule: NavigationItem = { page: 'schedule', label: 'nav.schedule', icon: 'schedule' }
  const progress: NavigationItem = { page: 'progress', label: 'nav.progress', icon: 'progress' }
  if (role === 'coach') return [home, schedule, { page: 'stats', label: 'nav.stats', icon: 'progress' }, profile]
  if (role === 'mentor') return [home, schedule, progress, profile]
  return [home, { page: 'log', label: 'nav.log', icon: 'log' }, progress, { page: 'learn', label: 'nav.learn', icon: 'learn' }, profile]
}

export function secondaryNavigation(role: AccountRole = 'player'): NavigationItem[] {
  const settings: NavigationItem = { page: 'settings', label: 'nav.settings', icon: 'settings' }
  if (role !== 'player') return [settings]
  return [
    { page: 'schedule', label: 'nav.schedule', icon: 'schedule' },
    { page: 'portal', label: 'nav.portal', icon: 'match' },
    { page: 'exercises', label: 'learn.exercises', icon: 'learn' },
    { page: 'challenges', label: 'nav.challenges', icon: 'trophy' },
    { page: 'leaderboard', label: 'leaderboard.title', icon: 'team' },
    settings,
  ]
}
