'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { UserCircle as ProfileIcon, Save as SaveIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/error-boundary'

export default function ProfilePage() {
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    setIsSaving(true)
    // Add save logic here
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      })
    }, 1000)
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ProfileIcon className="h-8 w-8 text-primary" />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold"
          >
            Profile Settings
          </motion.h1>
        </div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                <p className="text-gray-400">Update your personal details and preferences</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Full Name</label>
                  <Input 
                    type="text"
                    placeholder="John Doe"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Email</label>
                  <Input 
                    type="email"
                    placeholder="john@example.com"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Telegram Username</label>
                  <Input 
                    type="text"
                    placeholder="@username"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Discord Username</label>
                  <Input 
                    type="text"
                    placeholder="username#1234"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Trading Preferences</h2>
                <p className="text-gray-400">Configure your default trading settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Default Trade Size (SOL)</label>
                  <Input 
                    type="number"
                    placeholder="0.1"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Max Trade Size (SOL)</label>
                  <Input 
                    type="number"
                    placeholder="1.0"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  )
} 