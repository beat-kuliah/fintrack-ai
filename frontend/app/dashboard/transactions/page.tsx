'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AddTransactionModal from '@/components/transactions/AddTransactionModal'
import { ArrowLeftRight } from 'lucide-react'

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <DashboardLayout>
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="expense"
      />
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Transactions 💸
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            View and manage all your financial transactions
          </p>
        </div>

        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                All Transactions
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                View and manage your income and expenses
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
            >
              + Add Transaction
            </button>
          </div>
          
          <div className="text-center py-10 sm:py-12 lg:py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
              <ArrowLeftRight className="w-8 h-8 text-light-400 dark:text-dark-600" />
            </div>
            <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
              No transactions yet
            </p>
            <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
              Start tracking your finances by adding your first transaction
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
            >
              Add Your First Transaction
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

