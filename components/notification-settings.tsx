'use client'

import { Switch } from '@/components/ui/switch'
import { useSubscription } from '@/hooks/useSubscription'

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  tradingAlerts: {
    largeTransactions: boolean
    riskAlerts: boolean
    priceMovements: boolean
    tradingBotUpdates: boolean
  }
  securityAlerts: {
    newLogins: boolean
    configChanges: boolean
    apiUsage: boolean
  }
}

interface NotificationSettingsProps {
  settings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
  showAdvanced?: boolean
}

export function NotificationSettings({ 
  settings, 
  onSettingsChange,
  showAdvanced = true
}: NotificationSettingsProps) {
  const { tier } = useSubscription()
  const canAccessPriorityAlerts = tier !== 'free'

  return (
    <div className="space-y-8">
      {/* General Notifications */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-400">Receive updates via email</p>
            </div>
            <Switch 
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => 
                onSettingsChange({
                  ...settings,
                  emailNotifications: checked
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-400">Get instant updates in your browser</p>
            </div>
            <Switch 
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => 
                onSettingsChange({
                  ...settings,
                  pushNotifications: checked
                })
              }
            />
          </div>
        </div>
      </div>

      {showAdvanced && (
        <>
          {/* Trading Alerts */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Trading Alerts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Large Transactions</p>
                  <p className="text-sm text-gray-400">Alert when large transactions are detected</p>
                </div>
                <Switch 
                  checked={settings.tradingAlerts.largeTransactions}
                  onCheckedChange={(checked) => 
                    onSettingsChange({
                      ...settings,
                      tradingAlerts: { ...settings.tradingAlerts, largeTransactions: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Risk Alerts</p>
                  <p className="text-sm text-gray-400">Notify about high-risk activities</p>
                </div>
                <Switch 
                  checked={settings.tradingAlerts.riskAlerts}
                  onCheckedChange={(checked) => 
                    onSettingsChange({
                      ...settings,
                      tradingAlerts: { ...settings.tradingAlerts, riskAlerts: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Price Movements</p>
                  <p className="text-sm text-gray-400">Alert on significant price changes</p>
                  {!canAccessPriorityAlerts && (
                    <p className="text-xs text-primary">Pro feature</p>
                  )}
                </div>
                <Switch 
                  checked={settings.tradingAlerts.priceMovements}
                  disabled={!canAccessPriorityAlerts}
                  onCheckedChange={(checked) => 
                    onSettingsChange({
                      ...settings,
                      tradingAlerts: { ...settings.tradingAlerts, priceMovements: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trading Bot Updates</p>
                  <p className="text-sm text-gray-400">Get updates about bot activities</p>
                  {!canAccessPriorityAlerts && (
                    <p className="text-xs text-primary">Pro feature</p>
                  )}
                </div>
                <Switch 
                  checked={settings.tradingAlerts.tradingBotUpdates}
                  disabled={!canAccessPriorityAlerts}
                  onCheckedChange={(checked) => 
                    onSettingsChange({
                      ...settings,
                      tradingAlerts: { ...settings.tradingAlerts, tradingBotUpdates: checked }
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Security Alerts */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Security Alerts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Login Attempts</p>
                  <p className="text-sm text-gray-400">Alert on new device logins</p>
                </div>
                <Switch 
                  checked={settings.securityAlerts.newLogins}
                  onCheckedChange={(checked) => 
                    onSettingsChange({
                      ...settings,
                      securityAlerts: { ...settings.securityAlerts, newLogins: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Configuration Changes</p>
                  <p className="text-sm text-gray-400">Alert when settings are modified</p>
                </div>
                <Switch 
                  checked={settings.securityAlerts.configChanges}
                  onCheckedChange={(checked) => 
                    onSettingsChange({
                      ...settings,
                      securityAlerts: { ...settings.securityAlerts, configChanges: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">API Usage Alerts</p>
                  <p className="text-sm text-gray-400">Monitor API key usage and limits</p>
                  {!canAccessPriorityAlerts && (
                    <p className="text-xs text-primary">Pro feature</p>
                  )}
                </div>
                <Switch 
                  checked={settings.securityAlerts.apiUsage}
                  disabled={!canAccessPriorityAlerts}
                  onCheckedChange={(checked) => 
                    onSettingsChange({
                      ...settings,
                      securityAlerts: { ...settings.securityAlerts, apiUsage: checked }
                    })
                  }
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 