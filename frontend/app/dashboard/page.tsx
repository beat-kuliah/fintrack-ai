'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AddTransactionModal from '@/components/transactions/AddTransactionModal'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)

  return (
    <DashboardLayout>
      <AddTransactionModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        type="income"
      />
      <AddTransactionModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        type="expense"
      />
      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        type="expense"
      />
      <div className="w-full">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-2 sm:mb-3">
            Welcome back, <span className="text-gradient">{user?.name}</span>! 👋
          </h1>
          <p className="text-sm sm:text-base text-light-600 dark:text-dark-400">
            Here's your financial overview for today
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
        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Quick Actions
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Common tasks at your fingertips
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            <ActionButton
              icon={<ArrowUpRight className="w-5 h-5" />}
              label="Add Income"
              onClick={() => setIsIncomeModalOpen(true)}
            />
            <ActionButton
              icon={<ArrowDownRight className="w-5 h-5" />}
              label="Add Expense"
              onClick={() => setIsExpenseModalOpen(true)}
            />
            <ActionButton
              icon={<Wallet className="w-5 h-5" />}
              label="Wallets"
              onClick={() => router.push('/dashboard/wallets')}
            />
            <ActionButton
              icon={<TrendingUp className="w-5 h-5" />}
              label="Reports"
              onClick={() => router.push('/dashboard/reports')}
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100">
              Recent Transactions
            </h2>
            <button
              onClick={() => router.push('/dashboard/transactions')}
              className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              View All →
            </button>
          </div>
          <div className="text-center py-8 sm:py-12 lg:py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
              <ArrowLeftRight className="w-8 h-8 text-light-400 dark:text-dark-600" />
            </div>
            <p className="text-light-500 dark:text-dark-500 text-sm sm:text-base font-medium mb-2">
              No transactions yet
            </p>
            <p className="text-light-400 dark:text-dark-600 text-xs sm:text-sm mb-4">
              Start tracking your finances by adding your first transaction
            </p>
            <button
              onClick={() => setIsTransactionModalOpen(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
            >
              Add Transaction
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
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
    <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 group-hover:bg-primary-200 dark:group-hover:bg-primary-500/30 transition-all duration-300">
          {icon}
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
          trendUp 
            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' 
            : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <h3 className="text-xs sm:text-sm text-light-600 dark:text-dark-400 mb-2 font-medium">{title}</h3>
      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-light-800 dark:text-dark-100">{value}</p>
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
      className="flex flex-col items-center justify-center gap-2 p-4 sm:p-5 glass rounded-xl hover:bg-light-100/50 dark:hover:bg-white/5 transition-all duration-300 group hover:shadow-md hover:shadow-primary-500/10 hover:-translate-y-1 active:translate-y-0"
    >
      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-200 dark:group-hover:bg-primary-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-medium text-light-700 dark:text-dark-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{label}</span>
    </button>
  )
}
