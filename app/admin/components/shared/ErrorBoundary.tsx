/**
 * Error boundary component to catch and handle React errors gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/admin/utils/logger';
import { adminStyles } from '../../styles/adminStyles';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean; // If true, only this component tree is affected
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    // Log the error
    logger.error('React Error Boundary Caught Error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      props: this.props,
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);

    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Auto-retry after 5 seconds for the first 3 errors
    if (this.state.errorCount < 3) {
      this.resetTimeoutId = setTimeout(() => {
        this.resetErrorBoundary();
      }, 5000);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    
    // Reset on prop changes if enabled
    if (resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    // Reset on resetKeys change
    if (resetKeys && this.previousResetKeys.join(',') !== resetKeys.join(',')) {
      this.previousResetKeys = resetKeys;
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReset = () => {
    logger.info('Error boundary manually reset');
    this.resetErrorBoundary();
  };

  handleGoHome = () => {
    window.location.href = '/admin';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, isolate } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div style={{
          ...adminStyles.container,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isolate ? '400px' : '100vh',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '12px',
            padding: '40px',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertTriangle size={40} style={{ color: '#ef4444' }} />
              </div>
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ef4444',
              marginBottom: '10px',
            }}>
              Oops! Something went wrong
            </h1>

            <p style={{
              color: '#94a3b8',
              fontSize: '16px',
              marginBottom: '20px',
            }}>
              {isolate
                ? 'This component encountered an error and cannot be displayed.'
                : 'The application encountered an unexpected error.'}
            </p>

            {errorCount > 1 && (
              <p style={{
                color: '#f59e0b',
                fontSize: '14px',
                marginBottom: '20px',
              }}>
                Error occurred {errorCount} times. Auto-retry {errorCount < 3 ? 'in progress...' : 'limit reached.'}
              </p>
            )}

            {isDevelopment && (
              <details style={{
                textAlign: 'left',
                marginBottom: '30px',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  color: '#fdba74',
                  fontSize: '14px',
                  marginBottom: '10px',
                }}>
                  Error Details (Development Only)
                </summary>
                <div style={{
                  color: '#e2e8f0',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}>
                  <p><strong>Error:</strong> {error.message}</p>
                  {error.stack && (
                    <pre style={{
                      overflow: 'auto',
                      maxHeight: '200px',
                      marginTop: '10px',
                      padding: '10px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '4px',
                    }}>
                      {error.stack}
                    </pre>
                  )}
                  {errorInfo?.componentStack && (
                    <details style={{ marginTop: '10px' }}>
                      <summary style={{ cursor: 'pointer', color: '#fdba74' }}>
                        Component Stack
                      </summary>
                      <pre style={{
                        overflow: 'auto',
                        maxHeight: '200px',
                        marginTop: '10px',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '4px',
                      }}>
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </details>
            )}

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  ...adminStyles.button,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              
              {!isolate && (
                <>
                  <button
                    onClick={this.handleReload}
                    style={{
                      ...adminStyles.button,
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    }}
                  >
                    Reload Page
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    style={{
                      ...adminStyles.button,
                      background: 'rgba(148, 163, 184, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Home size={16} />
                    Go to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook to trigger error boundary from child components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    throwError: (error: Error) => setError(error),
    resetError: () => setError(null),
  };
}