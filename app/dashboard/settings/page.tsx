'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Settings as SettingsIcon, Save as SaveIcon } from 'lucide-react'
import { NotificationSettings, type NotificationSettings as NotificationSettingsType } from '@/components/notification-settings'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      tradingAlerts: {
        largeTransactions: true,
        riskAlerts: true,
        priceMovements: false,
        tradingBotUpdates: false
      },
      securityAlerts: {
        newLogins: true,
        configChanges: true,
        apiUsage: false
      }
    },
    theme: 'dark',
    language: 'en',
  })
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated.',
    })
  }

  const handleNotificationSettingsChange = (notificationSettings: NotificationSettingsType) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        ...notificationSettings
      }
    }))
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Settings
        </motion.h1>
      </div>

      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="space-y-6">
            {/* Notifications */}
            <NotificationSettings 
              settings={settings.notifications}
              onSettingsChange={handleNotificationSettingsChange}
              showAdvanced={false}
            />

            {/* Preferences */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <Input
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
} 