import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()

  return (
    <div className="flex flex-col min-h-dvh items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex flex-col items-center gap-6 max-w-sm w-full animate-fade-up">
        {/* Logo / branding */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl">⚽</span>
          <h1 className="text-3xl font-black text-gradient-green">Golazo</h1>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
            {t('login.tagline')}
          </p>
        </div>

        {/* Role cards */}
        <div className="flex flex-col gap-3 w-full mt-4">
          <button
            className="login-card tap-target"
            onClick={login}
            aria-label={t('login.asPlayer')}
          >
            <span className="text-3xl">⚽</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold">{t('login.asPlayer')}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('login.playerDesc')}
              </p>
            </div>
            <span className="text-lg" style={{ color: 'var(--color-text-muted)' }}>→</span>
          </button>

          <button
            className="login-card tap-target"
            onClick={login}
            aria-label={t('login.asMentor')}
          >
            <span className="text-3xl">🎯</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold">{t('login.asMentor')}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('login.mentorDesc')}
              </p>
            </div>
            <span className="text-lg" style={{ color: 'var(--color-text-muted)' }}>→</span>
          </button>

          <button
            className="login-card tap-target"
            onClick={login}
            aria-label={t('coach.role')}
          >
            <span className="text-3xl">📋</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold">{t('coach.role')}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('login.coachDesc')}
              </p>
            </div>
            <span className="text-lg" style={{ color: 'var(--color-text-muted)' }}>→</span>
          </button>
        </div>

        {/* Google sign-in info */}
        <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>
          🔒 {t('login.googleNote')}
        </p>

        {/* Skip for now (local dev) */}
        <button
          className="text-xs underline mt-2"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={() => {
            // Dispatch custom event to skip login
            window.dispatchEvent(new CustomEvent('golazo-skip-login'))
          }}
          aria-label={t('login.skip')}
        >
          {t('login.skip')}
        </button>
      </div>

      {/* NauroLabs footer */}
      <footer className="nl-footer mt-auto pt-8">
        <p>An experiment by <a href="https://naurolabs.com" target="_blank" rel="noopener noreferrer">nauro<span>Labs</span></a></p>
      </footer>
    </div>
  )
}
