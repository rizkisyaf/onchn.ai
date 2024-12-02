import React from 'react'
import { AlertCircle, CheckCircle, Bell, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NotificationType = 'error' | 'success' | 'info' | 'warning'

export interface NotificationProps {
  type: NotificationType
  message: string
  title?: string
  timestamp?: string
  isRead?: boolean
  onRead?: () => void
  className?: string
}

const iconMap = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
  warning: Bell,
}

const colorMap = {
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  success: 'bg-green-500/10 text-green-500 border-green-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  title,
  timestamp,
  isRead = true,
  onRead,
  className,
}) => {
  const Icon = iconMap[type]
  const colors = colorMap[type]

  return (
    <div 
      className={cn(
        'p-4 rounded-lg border transition-colors relative',
        colors,
        !isRead && 'bg-opacity-20',
        className
      )}
      role="alert"
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <p className="text-sm opacity-90">{message}</p>
          {timestamp && (
            <p className="text-xs opacity-60 mt-1">{timestamp}</p>
          )}
        </div>
        {!isRead && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        )}
      </div>
    </div>
  )
}

