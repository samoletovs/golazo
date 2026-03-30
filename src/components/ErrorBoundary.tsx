import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

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
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          padding: 24,
          background: '#FAFAFA',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 48, marginBottom: 16 }}>⚽</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, maxWidth: 320 }}>
            The app hit an unexpected error. Your data is safe — try refreshing.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: 9999,
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Refresh app
          </button>
          {this.state.error && (
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 16, maxWidth: 320, wordBreak: 'break-word' }}>
              {this.state.error.message}
            </p>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
