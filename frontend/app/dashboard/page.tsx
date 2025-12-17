'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Wallet, LogOut, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function DashboardPage() {
  const { user, isAuthenticated, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-light-600 dark:text-dark-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 bg-mesh noise transition-colors duration-300">
      {/* Navigation - Compact Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-light-200 dark:border-dark-800 transition-colors duration-300 h-14 sm:h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Wallet className="w-4 h-4 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold font-display">
              <span className="text-gradient">Fin</span>
              <span className="text-light-800 dark:text-dark-100">Track</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="hidden md:block text-right">
                <p className="text-xs text-light-600 dark:text-dark-400 leading-tight">Welcome back,</p>
                <p className="text-sm font-semibold text-light-800 dark:text-dark-100 leading-tight truncate max-w-[120px]">{user.name}</p>
              </div>
              <button
                onClick={logout}
                className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-sm text-light-600 dark:text-dark-300 hover:text-light-900 dark:hover:text-dark-100 font-medium transition-colors flex items-center gap-1.5 rounded-lg hover:bg-light-100/50 dark:hover:bg-white/5"
                title="Logout"
              >
                <LogOut size={16} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-[56px] sm:pt-[84px] px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
              Welcome back, <span className="text-gradient">{user.name}</span>! 👋
            </h1>
            <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
              Here's your financial overview
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-5 sm:mb-6">
            <StatCard
              title="Total Balance"
              value="Rp 0"
              icon={<Wallet className="w-5 h-5 sm:w-6 sm:h-6" />}
              trend="+0%"
              trendUp={true}
            />
            <StatCard
              title="Income"
              value="Rp 0"
              icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
              trend="+0%"
              trendUp={true}
            />
            <StatCard
              title="Expenses"
              value="Rp 0"
              icon={<TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />}
              trend="+0%"
              trendUp={false}
            />
            <StatCard
              title="Savings"
              value="Rp 0"
              icon={<ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />}
              trend="+0%"
              trendUp={true}
            />
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 mb-5 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-3 sm:mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
              <ActionButton
                icon={<ArrowUpRight className="w-5 h-5" />}
                label="Add Income"
                onClick={() => {}}
              />
              <ActionButton
                icon={<ArrowDownRight className="w-5 h-5" />}
                label="Add Expense"
                onClick={() => {}}
              />
              <ActionButton
                icon={<Wallet className="w-5 h-5" />}
                label="Wallets"
                onClick={() => {}}
              />
              <ActionButton
                icon={<TrendingUp className="w-5 h-5" />}
                label="Reports"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-3 sm:mb-4">
              Recent Transactions
            </h2>
            <div className="text-center py-6 sm:py-8 lg:py-12">
              <p className="text-light-500 dark:text-dark-500 text-xs sm:text-sm">
                No transactions yet. Start tracking your finances!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string
  value: string
  icon: React.ReactNode
  trend: string
  trendUp: boolean
}) {
  return (
    <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <h3 className="text-xs text-light-600 dark:text-dark-400 mb-1">{title}</h3>
      <p className="text-base sm:text-lg lg:text-xl font-bold text-light-800 dark:text-dark-100">{value}</p>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 glass rounded-lg sm:rounded-xl hover:bg-light-100/50 dark:hover:bg-white/5 transition-all duration-300 group"
    >
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-200 dark:group-hover:bg-primary-500/30 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
      <span className="text-xs font-medium text-light-700 dark:text-dark-300">{label}</span>
    </button>
  )
}

