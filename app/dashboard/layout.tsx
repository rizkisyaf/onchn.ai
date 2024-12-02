'use client'

import { ReactNode } from 'react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Enhanced Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-primary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(157,78,221,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      {/* Layout */}
      <div className="relative flex h-screen overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto md:ml-64">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 