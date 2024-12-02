'use client'

import { Analytics } from '@vercel/analytics/react'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/providers'

import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://onchn.ai" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      </head>
      <body className={cn('min-h-screen bg-[#000000] text-white font-sans antialiased')}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

