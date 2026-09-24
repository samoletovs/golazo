import { useState, useEffect, lazy, Suspense } from 'react'
import { AppProvider, useApp } from './contexts/AppContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { AcademyShell } from './components/academy/AcademyShell'
import { AcademyLoading } from './components/academy/AcademyState'
import { isPage } from './academy/navigation'
import type { Page } from './academy/navigation'
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const LogPage = lazy(() => import('./pages/LogPage').then(m => ({ default: m.LogPage })))
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { getPrimaryTeamColor } from './utils/teamTheme'
import { applySurfaceTheme, loadSurfaceTheme } from './utils/surfaceTheme'
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy-load heavier pages to reduce initial bundle
const Exercises = lazy(() => import('./pages/Exercises').then(m => ({ default: m.Exercises })))
const LearnPage = lazy(() => import('./pages/LearnPage').then(m => ({ default: m.LearnContent })))
const Challenges = lazy(() => import('./pages/Challenges').then(m => ({ default: m.Challenges })))
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))
const SchedulePage = lazy(() => import('./pages/SchedulePage').then(m => ({ default: m.SchedulePage })))
const ProgressPage = lazy(() => import('./pages/ProgressPage').then(m => ({ default: m.ProgressPage })))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const FootballPortal = lazy(() => import('./pages/FootballPortal').then(m => ({ default: m.FootballPortal })))
const MentorDashboard = lazy(() => import('./pages/MentorDashboard').then(m => ({ default: m.MentorDashboard })))
const CoachDashboard = lazy(() => import('./pages/CoachDashboard').then(m => ({ default: m.CoachDashboard })))
const SquadRoster = lazy(() => import('./pages/SquadRoster').then(m => ({ default: m.SquadRoster })))
const TrainingPlanner = lazy(() => import('./pages/TrainingPlanner').then(m => ({ default: m.TrainingPlanner })))
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })))
const EvaluationPage = lazy(() => import('./pages/EvaluationPage').then(m => ({ default: m.EvaluationPage })))
const AttendanceGrid = lazy(() => import('./components/AttendanceGrid').then(m => ({ default: m.AttendanceGrid })))
const TeamPickerLazy = lazy(() => import('./components/TeamPicker').then(m => ({ default: m.TeamPicker })))
const CoachStatsPage = lazy(() => import('./pages/CoachStatsPage').then(m => ({ default: m.CoachStatsPage })))
const TeamChallenges = lazy(() => import('./pages/TeamChallenges').then(m => ({ default: m.TeamChallenges })))

const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard')
  const [pageKey, setPageKey] = useState(0)
  const [coachTeamId, setCoachTeamId] = useState('')
  const [coachTeamName, setCoachTeamName] = useState('')
  const [coachTeamIds, setCoachTeamIds] = useState<string[]>([])
  const [evaluatePlayerId, setEvaluatePlayerId] = useState('')
  const [showTeamPicker, setShowTeamPicker] = useState(false)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const { user, loading: authLoading } = useAuth()
  const { onboardingComplete, profile, setProfile, syncing } = useApp()
  const [skippedLogin, setSkippedLogin] = useState(false)

  // Apply color theme — surface preset handles both surfaces AND accent color
  useEffect(() => {
    const teamColor = getPrimaryTeamColor(profile?.teams)
    applySurfaceTheme(loadSurfaceTheme(), teamColor)
  }, [profile?.teams])

  // Backfill colors from registry for teams added before colors were captured
  useEffect(() => {
    if (!profile?.teams?.length) return
    const needsColors = profile.teams.some((t) => t.active && (!t.colors || t.colors.length === 0))
    if (!needsColors) return
    const country = profile.country ?? 'LV'
    fetch(`/api/teams?country=${country}`)
      .then((r) => r.ok ? r.json() : { teams: [] })
      .then((data: { teams?: { id: string; name: string; colors?: string[]; logoUrl?: string }[] }) => {
        const registry = data.teams ?? []
        if (!registry.length) return
        const norm = (s: string) => s.toLowerCase().replace(/[āàâä]/g,'a').replace(/[ēėèêë]/g,'e').replace(/[īìîï]/g,'i').replace(/[ōõöò]/g,'o').replace(/[ūùûü]/g,'u').replace(/[čć]/g,'c').replace(/[šś]/g,'s').replace(/[žź]/g,'z').replace(/[ģ]/g,'g').replace(/[ķ]/g,'k').replace(/[ļ]/g,'l').replace(/[ņ]/g,'n')
        const updated = profile.teams!.map((t) => {
          if (t.colors?.length) return t
          const match = registry.find((r) =>
            (t.registryId && r.id === t.registryId) ||
            (t.clubId && r.id === t.clubId) ||
            (t.clubName && norm(r.name) === norm(t.clubName))
          )
          if (match?.colors?.length) {
            return { ...t, colors: match.colors, logoUrl: t.logoUrl || match.logoUrl }
          }
          return t
        })
        if (JSON.stringify(updated) !== JSON.stringify(profile.teams)) {
          setProfile({ ...profile, teams: updated })
        }
      })
      .catch(() => {})
  }, [profile?.teams?.length])

  // Reset to dashboard when role changes
  useEffect(() => {
    setPage('dashboard')
  }, [profile?.role])

  // Toggle squad in filter
  const toggleTeamFilter = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    )
  }

  // Page transition — re-key the content wrapper to trigger animation
  const handleNavigate = (p: string) => {
    if (!isPage(p)) {
      console.error('Unknown Golazo destination:', p)
      return
    }
    if (p !== page) {
      setPage(p)
      setPageKey(k => k + 1)
    }
  }

  // Listen for skip-login event (local dev only — not available in production)
  useEffect(() => {
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (!isLocalDev) return
    function handleSkip() { setSkippedLogin(true) }
    window.addEventListener('golazo-skip-login', handleSkip)
    return () => window.removeEventListener('golazo-skip-login', handleSkip)
  }, [])

  // Show loading skeleton while checking auth OR syncing data from cloud
  if (authLoading || syncing) {
    return (
      <main className="academy-bootstrap" data-academy-surface="bootstrap"><p className="academy-brand">golazo.</p><AcademyLoading /></main>
    )
  }

  // Show login if not authenticated
  // In production: require actual auth. In dev: allow skip + onboarding fallback.
  const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const isLoggedIn = user !== null || (isLocalDev && (skippedLogin || onboardingComplete))
  if (!isLoggedIn) {
    return <LoginPage />
  }

  // Show onboarding if profile not set up yet
  if (!onboardingComplete) {
    return <OnboardingPage />
  }

  // Coaches start on the coach dashboard
  const isCoach = profile?.role === 'coach'
  const isMentor = profile?.role === 'mentor'
  const isPlayer = !isCoach && !isMentor

  return (
    <div className="flex flex-col min-h-dvh">
      <AcademyShell page={page} onNavigate={handleNavigate}>
        <Suspense fallback={<AcademyLoading />}>
          <div key={pageKey} className="page-enter">
            {(page === 'dashboard' || page === 'activity') && isPlayer && <Dashboard onNavigate={handleNavigate} />}
            {page === 'dashboard' && isMentor && (
              <Suspense fallback={<div className="flex items-center justify-center p-8"><span className="text-3xl">⚽</span></div>}>
                <MentorDashboard />
              </Suspense>
            )}
            {page === 'dashboard' && isCoach && (
              <Suspense fallback={<div className="flex items-center justify-center p-8"><span className="text-3xl">⚽</span></div>}>
                <CoachDashboard
                  teams={profile?.managedTeams ?? []}
                  selectedTeamIds={selectedTeamIds}
                  onToggleTeam={toggleTeamFilter}
                  onNavigate={(sub, teamId) => {
                    setCoachTeamId(teamId)
                    setCoachTeamIds([teamId])
                    const team = profile?.managedTeams?.find(t => t.teamId === teamId)
                    setCoachTeamName(team?.teamName ?? teamId)
                    handleNavigate(`coach-${sub}`)
                  }}
                  onNavigateMulti={(sub, teamIds) => {
                    setCoachTeamIds(teamIds)
                    setCoachTeamId(teamIds[0] ?? '')
                    const names = teamIds.map(id => {
                      const team = profile?.managedTeams?.find(t => t.teamId === id)
                      return team?.teamName ?? id
                    })
                    setCoachTeamName(names.join(', '))
                    handleNavigate(`coach-${sub}`)
                  }}
                  onManageTeams={() => setShowTeamPicker(true)}
                />
              </Suspense>
            )}
            {page === 'log' && <LogPage />}
            <Suspense fallback={<div className="flex items-center justify-center p-8"><span className="text-3xl">⚽</span></div>}>
              {page === 'learn' && <LearnPage />}
              {page === 'exercises' && <Exercises />}
              {page === 'challenges' && <Challenges />}
              {page === 'profile' && <Profile />}
              {page === 'settings' && <SettingsPage />}
              {page === 'schedule' && <SchedulePage />}
              {page === 'progress' && <ProgressPage />}
              {page === 'leaderboard' && <LeaderboardPage />}
              {page === 'portal' && <FootballPortal />}
              {page === 'stats' && isCoach && (
                <CoachStatsPage
                  squads={profile?.managedTeams ?? []}
                  selectedIds={selectedTeamIds}
                  onToggleSquad={toggleTeamFilter}
                />
              )}
              {page === 'mentor' && <MentorDashboard />}
              {page === 'coach-roster' && coachTeamId && (
                <SquadRoster
                  teamId={coachTeamId}
                  teamName={coachTeamName}
                  onBack={() => handleNavigate('dashboard')}
                  onEvaluate={(playerId) => {
                    setEvaluatePlayerId(playerId)
                    handleNavigate('coach-evaluate')
                  }}
                />
              )}
              {page === 'coach-training' && coachTeamId && (
                <TrainingPlanner
                  teamId={coachTeamId}
                  teamName={coachTeamName}
                  teamIds={coachTeamIds}
                  coachId={profile?.id ?? ''}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
              {page === 'coach-announce' && coachTeamId && (
                <AnnouncementsPage
                  teamId={coachTeamId}
                  teamName={coachTeamName}
                  teamIds={coachTeamIds}
                  coachId={profile?.id ?? ''}
                  coachName={profile?.name ?? ''}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
              {page === 'coach-evaluate' && coachTeamId && (
                <EvaluationPage
                  teamId={coachTeamId}
                  teamName={coachTeamName}
                  coachId={profile?.id ?? ''}
                  coachName={profile?.name ?? ''}
                  initialPlayerId={evaluatePlayerId}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
              {page === 'coach-attendance' && coachTeamId && (
                <AttendanceGrid
                  teamId={coachTeamId}
                  teamName={coachTeamName}
                  teamIds={coachTeamIds}
                  teamNames={Object.fromEntries((profile?.managedTeams ?? []).map(team => [team.teamId, team.teamName]))}
                  coachId={profile?.id ?? ''}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
              {page === 'coach-challenges' && coachTeamId && (
                <TeamChallenges
                  teamId={coachTeamId}
                  teamName={coachTeamName}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
            </Suspense>
          </div>
        </Suspense>
      </AcademyShell>

      {/* Coach squad picker modal */}
      {showTeamPicker && (
        <Suspense fallback={null}>
          <TeamPickerLazy mode="coach" onClose={() => setShowTeamPicker(false)} />
        </Suspense>
      )}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
