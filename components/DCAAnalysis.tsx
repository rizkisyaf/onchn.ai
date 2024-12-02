'use client'

import { Card } from '@/components/ui/card'

interface DCAAnalysisProps {
  walletAddress: string
}

export function DCAAnalysis({ walletAddress }: DCAAnalysisProps) {
  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <h3 className="text-xl font-semibold mb-4">DCA Analysis</h3>
      <p className="text-gray-400">Analysis for {walletAddress}</p>
      {/* TODO: Add DCA analysis visualization */}
    </Card>
  )
}

