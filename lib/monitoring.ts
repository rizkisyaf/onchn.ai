import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { NextWebVitalsMetric } from 'next/app'

export function initMonitoring() {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', 'onchn.ai'],
      }),
    ],
  })

  // Initialize PostHog
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      persistence: 'localStorage',
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: process.env.NODE_ENV === 'development',
    })
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  })
}

export function captureMessage(message: string, context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    extra: context,
  })
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties)
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  posthog.identify(userId, traits)
}

export function reportWebVitals({ id, name, label, value }: NextWebVitalsMetric) {
  // Report to PostHog
  trackEvent('web_vitals', {
    metric_id: id,
    name,
    label,
    value,
  })

  // Report to Sentry
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: name,
    data: {
      id,
      name,
      label,
      value,
    },
  })
} 