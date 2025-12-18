'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { LogOut, User, Wallet } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 bg-mesh noise flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-900 border-t-primary-500 mx-auto mb-4"></div>
            <Wallet className="w-6 h-6 text-primary-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-light-600 dark:text-dark-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 bg-mesh noise transition-colors duration-300">
      <Sidebar />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 glass border-b border-light-200 dark:border-dark-800 transition-colors duration-300 h-14 sm:h-16">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            <div className="flex-1" /> {/* Spacer for mobile menu button */}
            
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-light">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 dark:bg-primary-500/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-light-600 dark:text-dark-400 leading-tight">Welcome back,</p>
                    <p className="text-sm font-semibold text-light-800 dark:text-dark-100 leading-tight truncate max-w-[120px]">
                      {user.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-sm text-light-600 dark:text-dark-300 hover:text-light-900 dark:hover:text-dark-100 font-medium transition-all duration-200 flex items-center gap-1.5 rounded-lg hover:bg-light-100/50 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
                  title="Logout"
                >
                  <LogOut size={16} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 pb-8 sm:pb-12 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}

