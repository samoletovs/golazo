import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { SwaClientPrincipal } from '../engine/types'

interface AuthContextValue {
  user: SwaClientPrincipal | null
  loading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SwaClientPrincipal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      // If user explicitly logged out, don't auto-authenticate
      if (localStorage.getItem('golazo-logged-out') === 'true') {
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/.auth/me')
        if (res.ok) {
          const data = await res.json() as { clientPrincipal: SwaClientPrincipal | null }
          setUser(data.clientPrincipal)
          if (data.clientPrincipal) fetch('/api/track-login', { method: 'POST' }).catch(() => {})
        }
      } catch {
        // Not running on SWA (local dev) — skip auth
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  function login() {
    // Clear the logged-out flag when user explicitly logs in
    localStorage.removeItem('golazo-logged-out')
    window.location.href = '/.auth/login/google?post_login_redirect_uri=/'
  }

  function logout() {
    // Set logged-out flag so app shows login page even if Google auto-re-authenticates
    localStorage.setItem('golazo-logged-out', 'true')
    window.location.href = '/.auth/logout?post_logout_redirect_uri=/'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
