import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://onchn.ai'),
  title: {
    default: 'onchn.ai - AI-Powered Solana Blockchain Detective',
    template: '%s | onchn.ai',
  },
  description: 'is it  Track wallets, analyze behavior patterns, and automate trading with confidence.',
  keywords: [
    'blockchain forensics',
    'solana',
    'cryptocurrency',
    'wallet tracking',
    'blockchain analysis',
    'trading automation',
    'AI trading',
    'crypto detective',
    'blockchain intelligence',
    'defi analytics',
  ],
  authors: [{ name: 'onchn.ai Team' }],
  creator: 'onchn.ai',
  publisher: 'onchn.ai',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://onchn.ai',
    title: 'onchn.ai - AI-Powered Solana Blockchain Detective',
    description: 'Advanced blockchain forensics and trading automation powered by AI',
    siteName: 'onchn.ai',
    images: [
      {
        url: 'https://onchn.ai/og-image.png',
        width: 1200,
        height: 630,
        alt: 'onchn.ai - AI-Powered Solana Blockchain Detective',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'onchn.ai - AI-Powered Solana Blockchain Detective',
    description: 'Advanced blockchain forensics and trading automation powered by AI',
    creator: '@onchn_ai',
    images: ['https://onchn.ai/twitter-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'your-google-site-verification',
    other: {
      'msvalidate.01': 'your-bing-site-verification',
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
} 