import { useState } from 'react'
import { AppProvider } from './contexts/AppContext'
import { XpBar } from './components/XpBar'
import { BottomNav } from './components/BottomNav'
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
      {/* XP bar header */}
      <header
        style={{
          background: 'var(--color-pitch-dark)',
          borderBottom: '1px solid var(--color-pitch-line)',
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

      {/* Bottom navigation */}
      <BottomNav active={page} onNavigate={(p) => setPage(p as Page)} />
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
