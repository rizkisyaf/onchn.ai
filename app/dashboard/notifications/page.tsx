'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Bell as NotificationIcon, Save as SaveIcon } from 'lucide-react'
import { NotificationsList } from '@/components/notifications-list'
import { NotificationSettings, type NotificationSettings as NotificationSettingsType } from '@/components/notification-settings'

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettingsType>({
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
  })
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    setIsSaving(true)
    // Add save logic here
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: 'Notifications Updated',
        description: 'Your notification preferences have been saved.',
      })
    }, 1000)
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <NotificationIcon className="h-8 w-8 text-primary" />
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Notifications
        </motion.h1>
      </div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 bg-white/5 border-white/10">
          <NotificationsList />
        </Card>
      </motion.div>
      
      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-white/5 border-white/10">
          <NotificationSettings 
            settings={settings}
            onSettingsChange={setSettings}
          />

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
} 