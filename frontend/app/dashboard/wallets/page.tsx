'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Wallet, Plus } from 'lucide-react'

export default function WalletsPage() {
  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Wallets 💳
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Manage your wallets and accounts
          </p>
        </div>

        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Your Wallets
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Track balances across different accounts
              </p>
            </div>
            <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Wallet
            </button>
          </div>
          
          <div className="text-center py-10 sm:py-12 lg:py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-light-400 dark:text-dark-600" />
            </div>
            <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
              No wallets yet
            </p>
            <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
              Add your first wallet to start tracking your finances
            </p>
            <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30">
              Add Your First Wallet
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

