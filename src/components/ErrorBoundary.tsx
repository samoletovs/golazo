import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import i18next from 'i18next'

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
        <div className="flex flex-col items-center justify-center min-h-dvh p-6 text-center animate-fade-up"
          style={{ background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>
          <span className="text-5xl mb-4 animate-float">⚽</span>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {t('error.title')}
          </h1>
          <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('error.description')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            {t('error.refresh')}
          </button>
          {this.state.error && (
            <p className="text-xs mt-4 max-w-xs break-words" style={{ color: 'var(--color-text-muted)' }}>
              {this.state.error.message}
            </p>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
