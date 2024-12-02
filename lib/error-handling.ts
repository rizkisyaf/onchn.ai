import * as Sentry from "@sentry/nextjs";

// Add global error handler for client-side errors
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('Client Error:', {
      message,
      source,
      lineno,
      colno,
      error
    });
    return false;
  };

  window.onunhandledrejection = function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    return false;
  };
}

export function initErrorHandling() {
  // Only initialize Sentry if DSN is provided
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: process.env.NODE_ENV === 'development',
      enabled: process.env.NODE_ENV === 'production', // Only enable in production
      beforeSend(event) {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Sentry Event:', event);
        }
        return event;
      },
    });
  } else {
    console.warn('Sentry DSN not provided - error tracking disabled');
  }
}

export function logError(error: Error, context?: any) {
  // In development, log to console with full details
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }
  
  // Only send to Sentry if initialized
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

export function handleApiError(error: any) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    logError(new Error(`API Error: ${error.response.status}`), {
      data: error.response.data,
      headers: error.response.headers,
    });
  } else if (error.request) {
    // The request was made but no response was received
    logError(new Error('API Error: No response received'), {
      request: error.request,
    });
  } else {
    // Something happened in setting up the request that triggered an Error
    logError(new Error('API Error: Request setup failed'), {
      message: error.message,
    });
  }
}

// Add React component error logging
export function handleComponentError(error: Error, componentStack: string) {
  logError(error, {
    type: 'React Component Error',
    componentStack,
  });
}

