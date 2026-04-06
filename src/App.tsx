import { useState, useEffect, lazy, Suspense } from 'react'
import { AppProvider, useApp } from './contexts/AppContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { XpBar } from './components/XpBar'
import { BottomNav } from './components/BottomNav'
import FeedbackButton from './components/FeedbackButton'
import { Dashboard } from './pages/Dashboard'
import { LogPage } from './pages/LogPage'
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

type Page = 'dashboard' | 'log' | 'learn' | 'exercises' | 'profile' | 'schedule' | 'progress' | 'leaderboard' | 'challenges' | 'portal' | 'mentor' | 'coach' | 'squads' | 'stats' | 'coach-roster' | 'coach-training' | 'coach-announce' | 'coach-evaluate' | 'coach-attendance'

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard')
  const [pageKey, setPageKey] = useState(0)
  const [coachTeamId, setCoachTeamId] = useState('')
  const [showTeamPicker, setShowTeamPicker] = useState(false)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const { user, loading: authLoading } = useAuth()
  const { onboardingComplete, profile, syncing } = useApp()
  const [skippedLogin, setSkippedLogin] = useState(false)

  // Apply color theme — surface preset handles both surfaces AND accent color
  useEffect(() => {
    const teamColor = getPrimaryTeamColor(profile?.teams)
    applySurfaceTheme(loadSurfaceTheme(), teamColor)
  }, [profile?.teams])

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
    if (p !== page) {
      setPage(p as Page)
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
      <div className="flex items-center justify-center min-h-dvh" style={{ background: 'var(--color-bg)' }}>
        <div className="flex flex-col items-center gap-3 animate-fade-up">
          <span className="text-5xl">⚽</span>
          <div className="skeleton" style={{ width: 120, height: 20 }} />
        </div>
      </div>
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
      <div className="app-shell flex flex-col min-h-dvh">
        {/* Header: XP bar for players only */}
        {isPlayer && (
          <header className="app-header">
            <XpBar />
          </header>
        )}

        <main className="flex-1 overflow-y-auto pb-20">
          <div key={pageKey} className="page-enter">
            {page === 'dashboard' && isPlayer && <Dashboard onNavigate={handleNavigate} />}
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
                  onNavigate={(sub, squadId) => {
                    setCoachTeamId(squadId)
                    handleNavigate(`coach-${sub}` as Page)
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
              {page === 'coach-roster' && (
                <SquadRoster
                  teamId={coachTeamId}
                  teamName={coachTeamId}
                  onBack={() => handleNavigate('dashboard')}
                  onEvaluate={() => {
                    handleNavigate('coach-evaluate')
                  }}
                />
              )}
              {page === 'coach-training' && (
                <TrainingPlanner
                  teamId={coachTeamId}
                  teamName={coachTeamId}
                  coachId={profile?.id ?? ''}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
              {page === 'coach-announce' && (
                <AnnouncementsPage
                  teamId={coachTeamId}
                  teamName={coachTeamId}
                  coachId={profile?.id ?? ''}
                  coachName={profile?.name ?? ''}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
              {page === 'coach-evaluate' && (
                <EvaluationPage
                  teamId={coachTeamId}
                  teamName={coachTeamId}
                  coachId={profile?.id ?? ''}
                  coachName={profile?.name ?? ''}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
              {page === 'coach-attendance' && (
                <AttendanceGrid
                  teamId={coachTeamId}
                  teamName={coachTeamId}
                  coachId={profile?.id ?? ''}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
            </Suspense>
          </div>
        </main>

        <footer className="nl-footer">
          <p>An experiment by <a href="https://naurolabs.com" target="_blank" rel="noopener noreferrer">nauro<span>Labs</span></a></p>
        </footer>
      </div>

      <BottomNav active={page} onNavigate={handleNavigate} role={profile?.role} />
      <FeedbackButton />

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
