import React from 'react';
import Logo from './Logo';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Workspace render error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--ink-900)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <Logo size={32} />
            </div>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--ink-900)',
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--ink-600)',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              The workspace encountered an unexpected rendering error. You can reload the page to restore your session.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                height: '36px',
                padding: '0 16px',
                backgroundColor: 'var(--accent)',
                color: 'var(--surface)',
                borderRadius: 'var(--r-sm)',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
