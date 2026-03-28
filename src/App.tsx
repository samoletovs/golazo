import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './contexts/AppContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { XpBar } from './components/XpBar'
import { BottomNav } from './components/BottomNav'
import FeedbackButton from './components/FeedbackButton'
import { Dashboard } from './pages/Dashboard'
import { LogPage } from './pages/LogPage'
import { Exercises } from './pages/Exercises'
import { Challenges } from './pages/Challenges'
import { Profile } from './pages/Profile'
import { SchedulePage } from './pages/SchedulePage'
import { ProgressPage } from './pages/ProgressPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'

type Page = 'dashboard' | 'log' | 'exercises' | 'challenges' | 'profile' | 'schedule' | 'progress' | 'leaderboard'

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard')
  const { user, loading: authLoading } = useAuth()
  const { onboardingComplete } = useApp()
  const [skippedLogin, setSkippedLogin] = useState(false)

  // Listen for skip-login event (local dev)
  useEffect(() => {
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

  // Show login if not authenticated (and didn't skip + hasn't completed onboarding before)
  const isLoggedIn = user !== null || skippedLogin || onboardingComplete
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
          {page === 'dashboard' && <Dashboard />}
          {page === 'log' && <LogPage />}
          {page === 'exercises' && <Exercises />}
          {page === 'challenges' && <Challenges />}
          {page === 'profile' && <Profile />}
          {page === 'schedule' && <SchedulePage />}
          {page === 'progress' && <ProgressPage />}
          {page === 'leaderboard' && <LeaderboardPage />}
        </main>

        <footer className="nl-footer">
          <p>An experiment by <a href="https://naurolabs.com" target="_blank" rel="noopener noreferrer">nauro<span>Labs</span></a></p>
        </footer>
      </div>

      <BottomNav active={page} onNavigate={(p) => setPage(p as Page)} />
      <FeedbackButton />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  )
}
