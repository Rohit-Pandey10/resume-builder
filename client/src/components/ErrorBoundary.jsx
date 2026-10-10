import React from 'react';

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
            backgroundColor: 'var(--color-bg-base, #FAF8F5)',
            color: 'var(--color-text-1, #1C1917)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border, #E7E2DA)',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: 'var(--shadow-popover, 0 8px 24px rgba(28,25,23,0.08))',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--color-text-1, #1C1917)',
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-2, #57534E)',
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
                backgroundColor: 'var(--color-accent, #0F766E)',
                color: '#FFFFFF',
                borderRadius: '6px',
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
