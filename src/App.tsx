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
import { applyTeamTheme, getPrimaryTeamColor } from './utils/teamTheme'
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

type Page = 'dashboard' | 'log' | 'learn' | 'exercises' | 'profile' | 'schedule' | 'progress' | 'leaderboard' | 'challenges' | 'portal' | 'mentor'

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard')
  const [pageKey, setPageKey] = useState(0)
  const { user, loading: authLoading } = useAuth()
  const { onboardingComplete, profile } = useApp()
  const [skippedLogin, setSkippedLogin] = useState(false)

  // Apply team-based color theme
  useEffect(() => {
    const teamColor = getPrimaryTeamColor(profile?.teams)
    applyTeamTheme(teamColor)
  }, [profile?.teams])

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

  // Show loading skeleton while checking auth
  if (authLoading) {
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

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="app-shell flex flex-col min-h-dvh">
        <header className="app-header">
          <XpBar />
        </header>

        <main className="flex-1 overflow-y-auto pb-20">
          <div key={pageKey} className="page-enter">
            {page === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
            {page === 'log' && <LogPage />}
            <Suspense fallback={<div className="flex items-center justify-center p-8"><span className="text-3xl">⚽</span></div>}>
              {page === 'learn' && <LearnPage />}
              {page === 'exercises' && <Exercises />}
              {page === 'challenges' && <Challenges />}
              {page === 'profile' && <Profile onNavigate={handleNavigate} />}
              {page === 'schedule' && <SchedulePage />}
              {page === 'progress' && <ProgressPage />}
              {page === 'leaderboard' && <LeaderboardPage />}
              {page === 'portal' && <FootballPortal />}
              {page === 'mentor' && <MentorDashboard onBack={() => handleNavigate('profile')} />}
            </Suspense>
          </div>
        </main>

        <footer className="nl-footer">
          <p>An experiment by <a href="https://naurolabs.com" target="_blank" rel="noopener noreferrer">nauro<span>Labs</span></a></p>
        </footer>
      </div>

      <BottomNav active={page} onNavigate={handleNavigate} />
      <FeedbackButton />
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
