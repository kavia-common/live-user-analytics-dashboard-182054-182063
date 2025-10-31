import React from 'react';

/**
 * PUBLIC_INTERFACE
 * ErrorBoundary: Catches render errors and displays a friendly fallback UI instead of a blank screen.
 * Use to wrap top-level routes and critical UI sections to prevent the entire app from crashing.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to show fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Console-safe logging to avoid throwing if console is not available
    try {
      if (typeof window !== 'undefined' && window?.console) {
        // eslint-disable-next-line no-console
        console.error('UI error caught by ErrorBoundary:', error, info);
      }
    } catch (_) {
      /* noop */
    }
    this.setState({ info });
  }

  handleRetry = () => {
    // Reset state allowing a new render attempt
    this.setState({ hasError: false, error: null, info: null });
    // Optionally trigger a refresh of the current route
    try {
      if (typeof window !== 'undefined') {
        // Lightweight re-render: force update by toggling a dummy state could also work
        // Keep it simple: do nothing, parent state change will re-render children
      }
    } catch (_) {
      /* noop */
    }
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) return fallback;

      // Default fallback UI with minimal styles
      return (
        <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(239,68,68,0.1)',
                  color: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                !
              </span>
              <h2 style={{ margin: 0, fontSize: 18 }}>Something went wrong</h2>
            </div>
            <p style={{ marginTop: 0, marginBottom: 12, color: '#374151' }}>
              The interface encountered an error and was recovered. You can try again below.
            </p>
            {error && (
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: '#F9FAFB',
                  borderRadius: 8,
                  overflowX: 'auto',
                  fontSize: 12,
                  color: '#6B7280',
                }}
              >
                {String(error?.message || error)}
              </pre>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#7C3AED',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    if (typeof window !== 'undefined') window.location.reload();
                  } catch (_) {
                    /* noop */
                  }
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#0D9488',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
