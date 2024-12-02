'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/app/components/logo'
import { ErrorBoundary } from '@/components/error-boundary'

const features = [
  "Advanced risk assessment of wallets and transactions",
  "Deep dive into wallet behaviors and patterns",
  "Track transactions and token movements in real-time",
  "AI-powered automated trading strategies",
  "Smart contract and PDA interaction analysis",
  "Seamless Jupiter DEX integration"
]

const TypewriterEffect = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[index])
        setIndex((prev) => prev + 1)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [index, text])

  return <span>{displayText}</span>
}

export default function Home() {
  const [currentFeature, setCurrentFeature] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Enhanced Background */}
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-primary/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(157,78,221,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:14px_24px]" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <header className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center space-x-2">
              <Logo size={32} />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                onchn.ai
              </span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/login">
                <Button className="bg-white hover:bg-white/90 text-primary rounded-full px-8">
                  Login
                </Button>
              </Link>
            </nav>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
            <div className="max-w-5xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <Logo size={240} className="mx-auto" />
              </motion.div>
              
              <motion.h1
                className="text-6xl sm:text-7xl font-bold tracking-tight mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Solana Chain Analysis,{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Reimagined
                </span>
              </motion.h1>

              <motion.div
                className="text-lg text-gray-400 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentFeature}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TypewriterEffect text={features[currentFeature]} />
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Link href="/dashboard">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-12 py-6 text-lg">
                    Launch App
                  </Button>
                </Link>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}

