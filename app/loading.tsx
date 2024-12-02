'use client'

import { motion } from 'framer-motion'
import { Logo } from '@/app/components/logo'

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Enhanced Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-primary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(157,78,221,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <Logo size={80} />
          <motion.div
            className="absolute inset-0"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/50" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

