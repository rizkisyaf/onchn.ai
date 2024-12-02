'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Notification, NotificationType } from '@/components/Notification'
import { Trash2 } from 'lucide-react'

interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  isRead: boolean
}

export function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Large Transaction Detected',
      message: 'A wallet you\'re tracking made a transaction over 1000 SOL',
      timestamp: '2 minutes ago',
      isRead: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'Trade Executed',
      message: 'Your auto-trader successfully executed a trade',
      timestamp: '1 hour ago',
      isRead: true,
    },
    {
      id: '3',
      type: 'info',
      title: 'New Feature Available',
      message: 'Check out our new token analysis tools',
      timestamp: '1 day ago',
      isRead: true,
    },
  ])

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, isRead: true } : notif
    ))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400">{unreadCount} unread</p>
          )}
        </div>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        {notifications.length === 0 ? (
          <Card className="p-8 bg-white/5 border-white/10 text-center">
            <p className="text-gray-400">No notifications</p>
          </Card>
        ) : (
          notifications.map(notification => (
            <Notification
              key={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              timestamp={notification.timestamp}
              isRead={notification.isRead}
              onRead={() => markAsRead(notification.id)}
              className="cursor-pointer hover:bg-opacity-20"
            />
          ))
        )}
      </motion.div>
    </div>
  )
} 