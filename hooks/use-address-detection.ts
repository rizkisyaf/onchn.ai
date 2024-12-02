'use client'

import { useCallback, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { AddressDetectionService, AddressMetadata } from '@/lib/address-detection'

interface AddressDetectionOptions {
  onDetection?: (metadata: AddressMetadata) => void
}

export function useAddressDetection(options: AddressDetectionOptions = {}) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const detect = useCallback(async (address: string) => {
    setIsDetecting(true)
    setError(null)

    try {
      const detectionService = new AddressDetectionService(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      )

      const metadata = await detectionService.detectAddressType(address)
      options.onDetection?.(metadata)

      if (metadata.risk?.level === 'high') {
        toast({
          title: 'High Risk Address',
          description: `Risk Level: ${metadata.risk.level} - ${metadata.risk.reason}`,
        })
      }

      return metadata
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to detect address type')
      setError(error)
      toast({
        title: 'Error',
        description: error.message,
      })
      throw error
    } finally {
      setIsDetecting(false)
    }
  }, [options, toast])

  return {
    detect,
    isDetecting,
    error,
  }
} 