import { motion } from 'framer-motion'
import Image from 'next/image'

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <motion.div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Image
        src="/images/logo/logo-mark.svg"
        alt="onchn.ai logo"
        width={size}
        height={size}
        className="w-full h-full"
      />
    </motion.div>
  )
} 