'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  TrendingUp,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Tag
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Transactions',
    href: '/dashboard/transactions',
    icon: <ArrowLeftRight className="w-5 h-5" />,
  },
  {
    name: 'Budgeting',
    href: '/dashboard/budgeting',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    name: 'Categories',
    href: '/dashboard/categories',
    icon: <Tag className="w-5 h-5" />,
  },
  {
    name: 'Wallets',
    href: '/dashboard/wallets',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="w-5 h-5" />,
  },
]

interface SidebarProps {
  isMobileOpen?: boolean
  setIsMobileOpen?: (open: boolean) => void
}

export default function Sidebar({ isMobileOpen: externalIsMobileOpen, setIsMobileOpen: externalSetIsMobileOpen }: SidebarProps = {}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [internalIsMobileOpen, setInternalIsMobileOpen] = useState(false)

  // Use external state if provided, otherwise use internal state
  const isMobileOpen = externalIsMobileOpen !== undefined ? externalIsMobileOpen : internalIsMobileOpen
  const setIsMobileOpen = externalSetIsMobileOpen || setInternalIsMobileOpen

  return (
    <>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 glass border-r border-light-200 dark:border-dark-800 z-40
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-light-200 dark:border-dark-800">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 group flex-1"
                onClick={() => setIsMobileOpen(false)}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-all duration-300">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold font-display">
                  <span className="text-gradient">Fin</span>
                  <span className="text-light-800 dark:text-dark-100">Track</span>
                </span>
              </Link>
              {/* Close button - only show on mobile when menu is open */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-2 rounded-lg text-light-600 dark:text-dark-400 hover:bg-light-100/50 dark:hover:bg-white/5 hover:text-light-800 dark:hover:text-dark-200 transition-all duration-200"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {navigation.map((item) => {
              // For Dashboard, only active if exactly /dashboard
              // For other routes, active if exact match or starts with route + '/'
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300
                    relative group
                    ${isActive
                      ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 shadow-sm shadow-primary-500/10'
                      : 'text-light-600 dark:text-dark-400 hover:bg-light-100/50 dark:hover:bg-white/5 hover:text-light-800 dark:hover:text-dark-200 hover:translate-x-1'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                  )}
                  <span className={`
                    transition-transform duration-300
                    ${isActive ? 'text-primary-600 dark:text-primary-400 scale-110' : 'group-hover:scale-110'}
                  `}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-light-200 dark:border-dark-800 space-y-2">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-light-100/50 dark:bg-dark-800/50">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 dark:bg-primary-500/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-light-800 dark:text-dark-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-light-500 dark:text-dark-500 truncate">
                    {user.email || user.username}
                  </p>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={() => {
                setIsMobileOpen(false)
                logout()
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-light-600 dark:text-dark-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="flex-1 text-left">Logout</span>
            </button>

            {/* Copyright */}
            <div className="text-xs text-light-500 dark:text-dark-500 text-center pt-2">
              © 2024 FinTrack
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

