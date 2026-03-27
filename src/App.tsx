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
          background: 'rgba(12, 17, 23, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
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
