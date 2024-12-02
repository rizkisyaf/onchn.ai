import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import RootLayout from './layout'
import { metadata, viewport } from './metadata'

export { metadata, viewport }

const fontSans = GeistSans
const fontMono = GeistMono

export default function ServerRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`min-h-screen bg-background font-sans antialiased ${fontSans.variable} ${fontMono.variable}`}
      >
        <RootLayout>{children}</RootLayout>
      </body>
    </html>
  )
} 