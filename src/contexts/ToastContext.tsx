import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'achievement'

interface Toast {
  id: number
  message: string
  type: ToastType
  icon?: string
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, icon?: string) => void
  showXpToast: (xp: number) => void
  showAchievement: (title: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = 'success', icon?: string) => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, message, type, icon }])
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3200)
  }, [])

  const showXpToast = useCallback((xp: number) => {
    showToast(`+${xp} XP`, 'success', '⭐')
  }, [showToast])

  const showAchievement = useCallback((title: string) => {
    showToast(title, 'achievement', '🏆')
  }, [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, showXpToast, showAchievement }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          style={{ animationDelay: `${i * 60}ms` }}
          onClick={() => onDismiss(toast.id)}
          role="alert"
        >
          {toast.icon && <span className="toast-icon">{toast.icon}</span>}
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
