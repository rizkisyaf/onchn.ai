'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  LayoutDashboard,
  Brain,
  Bot,
  Bell,
  Settings,
  CreditCard,
} from 'lucide-react'

const routes = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-sky-500',
  },
  {
    label: 'Analyze',
    icon: Brain,
    color: 'text-violet-500',
    submenu: [
      {
        label: 'Wallet Analysis',
        href: '/dashboard/wallet-analysis',
      },
      {
        label: 'Behavior Analysis',
        href: '/dashboard/behavior-analysis',
      },
      {
        label: 'Token Analysis',
        href: '/dashboard/token',
      },
    ],
  },
  {
    label: 'Auto Trader',
    icon: Bot,
    href: '/dashboard/auto-trader',
    color: 'text-pink-700',
  },
  {
    label: 'Notifications',
    icon: Bell,
    href: '/dashboard/notifications',
    color: 'text-green-500',
  },
  {
    label: 'Settings',
    icon: Settings,
    color: 'text-orange-500',
    submenu: [
      {
        label: 'General',
        href: '/dashboard/settings',
      },
      {
        label: 'Security',
        href: '/dashboard/security',
      },
      {
        label: 'API Keys',
        href: '/dashboard/api-keys',
      },
    ],
  },
  {
    label: 'Subscription',
    icon: CreditCard,
    href: '/dashboard/subscription',
    color: 'text-emerald-500',
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0">
      <div className="space-y-4 py-4 flex flex-col h-full bg-black/80 backdrop-blur-sm border-r border-white/10">
        <div className="px-3 py-2 flex-1">
          <Link href="/dashboard" className="flex items-center pl-3 mb-14">
            <div className="relative w-8 h-8 mr-4">
              <Image
                src="/images/logo/logo-mark.svg"
                alt="onchn.ai logo"
                width={32}
                height={32}
                className="w-auto h-8"
              />
            </div>
            <span className="text-lg font-bold tracking-wider text-white">ONCHN.AI</span>
          </Link>
          <div className="space-y-1">
            {routes.map((route) => (
              <div key={route.label}>
                {route.submenu ? (
                  <div className="mb-2">
                    <div className={cn(
                      'flex items-center pl-3 mb-2 text-sm font-medium',
                      route.color
                    )}>
                      <route.icon className={cn('h-5 w-5 mr-3')} />
                      {route.label}
                    </div>
                    <div className="pl-11 space-y-1">
                      {route.submenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition',
                            pathname === item.href ? 'text-white bg-white/10' : 'text-zinc-400',
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={route.href!}
                    className={cn(
                      'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition',
                      pathname === route.href ? 'text-white bg-white/10' : 'text-zinc-400',
                    )}
                  >
                    <div className="flex items-center flex-1">
                      <route.icon className={cn('h-5 w-5 mr-3', route.color)} />
                      {route.label}
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 