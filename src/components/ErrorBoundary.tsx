import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-8">
          <div className="bg-red-900/30 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-2xl font-bold text-red-300 mb-4">Something went wrong</h2>
              <p className="text-gray-300 mb-6">
                An error occurred while loading this component. This might be due to a configuration issue.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-red-400 font-medium mb-2">
                    View Error Details (Development)
                  </summary>
                  <div className="bg-black/50 rounded-lg p-4 text-xs font-mono text-red-200 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  🔄 Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  🏠 Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 