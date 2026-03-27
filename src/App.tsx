import { useState } from 'react'
import { AppProvider } from './contexts/AppContext'
import { XpBar } from './components/XpBar'
import { BottomNav } from './components/BottomNav'
import FeedbackButton from './components/FeedbackButton'
import { Dashboard } from './pages/Dashboard'
import { LogPage } from './pages/LogPage'
import { Exercises } from './pages/Exercises'
import { Challenges } from './pages/Challenges'
import { Profile } from './pages/Profile'

type Page = 'dashboard' | 'log' | 'exercises' | 'challenges' | 'profile'

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard')

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Desktop: centered app shell */}
      <div className="app-shell flex flex-col min-h-dvh">
        {/* XP bar header */}
        <header
          style={{
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <XpBar />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {page === 'dashboard' && <Dashboard />}
          {page === 'log' && <LogPage />}
          {page === 'exercises' && <Exercises />}
          {page === 'challenges' && <Challenges />}
          {page === 'profile' && <Profile />}
        </main>

        {/* NauroLabs footer */}
        <footer className="nl-footer">
          <p>An experiment by <a href="https://naurolabs.com" target="_blank" rel="noopener noreferrer">nauro<span>Labs</span></a></p>
        </footer>
      </div>

      {/* Bottom navigation */}
      <BottomNav active={page} onNavigate={(p) => setPage(p as Page)} />
      <FeedbackButton />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
