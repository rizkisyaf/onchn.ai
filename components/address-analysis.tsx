'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAddressDetection } from '@/hooks/use-address-detection'
import { AddressMetadata } from '@/types/wallet'

interface AddressAnalysisProps {
  address: string
  onDetection?: (metadata: AddressMetadata) => void
}

export function AddressAnalysis({ address, onDetection }: AddressAnalysisProps) {
  const { detect, isDetecting, error } = useAddressDetection({
    onDetection,
  })

  useEffect(() => {
    if (address) {
      detect(address)
    }
  }, [address, detect])

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-red-500">
          <h3 className="font-semibold">Error</h3>
          <p>{error.message}</p>
        </div>
      </Card>
    )
  }

  if (isDetecting) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="font-semibold">Detecting Address Type...</h3>
          <Progress value={50} />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="font-semibold">Address Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Select an address to analyze its type and properties.
        </p>
      </div>
    </Card>
  )
} 