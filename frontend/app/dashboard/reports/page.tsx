'use client'

import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { TrendingUp } from 'lucide-react'

export default function ReportsPage() {
  const router = useRouter()
  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Reports 📊
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Analyze your financial data with detailed reports
          </p>
        </div>

        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Financial Reports
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Analyze your spending patterns and trends
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
              Export →
            </button>
          </div>
          
          <div className="text-center py-10 sm:py-12 lg:py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-light-400 dark:text-dark-600" />
            </div>
            <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
              No data available yet
            </p>
            <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
              Start adding transactions to generate insightful reports
            </p>
            <button
              onClick={() => router.push('/dashboard/transactions')}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
            >
              Go to Transactions
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

