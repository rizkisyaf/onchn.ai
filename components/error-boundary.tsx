'use client'

import React from 'react'
import { APIErrorImpl } from '@/lib/api-client'
import { handleComponentError } from '@/lib/error-handling'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    handleComponentError(error, errorInfo.componentStack || 'No stack trace available')
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const error = this.state.error
      if (error instanceof APIErrorImpl) {
        return (
          <div className="p-4 rounded-md bg-red-50 border border-red-200">
            <h3 className="text-lg font-semibold text-red-800">
              {error.code === 'RATE_LIMIT' ? 'Too Many Requests' : 'Error'}
            </h3>
            <p className="text-red-700">{error.message}</p>
            {error.code === 'RATE_LIMIT' && (
              <p className="text-sm text-red-600 mt-2">
                Please wait a moment before trying again.
              </p>
            )}
          </div>
        )
      }

      return (
        <div className="p-4 rounded-md bg-red-50 border border-red-200">
          <h3 className="text-lg font-semibold text-red-800">Something went wrong</h3>
          <p className="text-red-700">
            {error.message || 'An unexpected error occurred. Please try again later.'}
          </p>
          {process.env.NODE_ENV === 'development' && error.stack && (
            <pre className="mt-2 text-xs text-red-600 overflow-auto">
              {error.stack}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

