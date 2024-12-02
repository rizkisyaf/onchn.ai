'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Key as KeyIcon, Copy as CopyIcon, Plus as PlusIcon } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Production Key', key: 'sk_live_123...abc', createdAt: '2023-12-01' },
    { id: 2, name: 'Development Key', key: 'sk_test_456...xyz', createdAt: '2023-12-15' },
  ])
  const { toast } = useToast()
  const { tier } = useSubscription()

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: 'API Key Copied',
      description: 'The API key has been copied to your clipboard.',
    })
  }

  const createNewKey = () => {
    // In a real app, this would call an API to generate a new key
    const newKey = {
      id: apiKeys.length + 1,
      name: `API Key ${apiKeys.length + 1}`,
      key: `sk_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setApiKeys([...apiKeys, newKey])
    toast({
      title: 'New API Key Created',
      description: 'Your new API key has been generated successfully.',
    })
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyIcon className="h-8 w-8 text-primary" />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold"
          >
            API Keys
          </motion.h1>
        </div>
        <Button onClick={createNewKey} disabled={tier === 'free'}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create New Key
        </Button>
      </div>

      {/* API Keys List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="space-y-6">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <h3 className="font-medium">{apiKey.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm text-gray-400">{apiKey.key}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Created on {apiKey.createdAt}</p>
                </div>
              </div>
            ))}

            {tier === 'free' && (
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <p className="text-sm text-yellow-500">
                  Upgrade your subscription to create API keys
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
} 