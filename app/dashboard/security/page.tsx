'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Shield as SecurityIcon, Key as KeyIcon, Smartphone as PhoneIcon, History as HistoryIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/error-boundary'

export default function SecurityPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    setIsSaving(true)
    // Add save logic here
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: 'Security Settings Updated',
        description: 'Your security preferences have been saved.',
      })
    }, 1000)
  }

  const handle2FAToggle = (enabled: boolean) => {
    setIs2FAEnabled(enabled)
    toast({
      title: enabled ? '2FA Enabled' : '2FA Disabled',
      description: enabled 
        ? 'Two-factor authentication has been enabled for your account.' 
        : 'Two-factor authentication has been disabled.',
    })
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <SecurityIcon className="h-8 w-8 text-primary" />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold"
          >
            Security Settings
          </motion.h1>
        </div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <KeyIcon className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">Password</h2>
                  <p className="text-gray-400">Update your password to keep your account secure</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Current Password</label>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">New Password</label>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Two-Factor Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <PhoneIcon className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
                    <p className="text-gray-400">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <Switch 
                  checked={is2FAEnabled}
                  onCheckedChange={handle2FAToggle}
                />
              </div>

              {is2FAEnabled && (
                <div className="pt-4 border-t border-white/10">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Phone Number</label>
                    <Input 
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Login History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <HistoryIcon className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">Login History</h2>
                  <p className="text-gray-400">Recent login activity on your account</p>
                </div>
              </div>

              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <div>
                      <p className="font-medium">Chrome on MacOS</p>
                      <p className="text-sm text-gray-400">San Francisco, CA</p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      </div>
    </ErrorBoundary>
  )
} 