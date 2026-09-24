import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import i18next from 'i18next'
import { TacticalGraphic } from './academy/TacticalGraphic'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Golazo error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const t = i18next.t.bind(i18next)
      return (
        <main className="academy-welcome" data-academy-surface="error-boundary">
          <aside className="academy-welcome-story"><p className="academy-brand">golazo.</p><TacticalGraphic kind="turn" /></aside>
          <section className="academy-welcome-form">
          <h1>
            {t('error.title')}
          </h1>
          <p className="academy-muted">
            {t('error.description')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="academy-button"
          >
            {t('error.refresh')}
          </button>
          {this.state.error && (
            <p className="text-xs mt-4 max-w-xs break-words" style={{ color: 'var(--color-text-muted)' }}>
              {this.state.error.message}
            </p>
          )}
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
