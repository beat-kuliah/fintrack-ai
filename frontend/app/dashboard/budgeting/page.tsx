'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Wallet, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react'

export default function BudgetingPage() {
  // Placeholder data - akan dihubungkan dengan API nanti
  const monthlyBudget = 5000000
  const currentExpenses = 3200000
  const remaining = monthlyBudget - currentExpenses
  const percentageUsed = (currentExpenses / monthlyBudget) * 100
  const isOverBudget = currentExpenses > monthlyBudget

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Budgeting 💰
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Track your monthly expenses and stay within budget
          </p>
        </div>

        {/* Budget Overview Card */}
        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 mb-5 sm:mb-6 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Monthly Budget Overview
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Track your spending for this month
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${
              isOverBudget 
                ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 shadow-sm shadow-red-500/10' 
                : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 shadow-sm shadow-green-500/10'
            }`}>
              {isOverBudget ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">
                {isOverBudget ? 'Over Budget' : 'Within Budget'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-light-600 dark:text-dark-400">Budget Usage</span>
              <span className={`text-sm font-bold ${
                isOverBudget 
                  ? 'text-red-600 dark:text-red-400' 
                  : percentageUsed > 80
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {percentageUsed.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-4 bg-light-200 dark:bg-dark-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-700 ease-out relative ${
                  isOverBudget 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : percentageUsed > 80
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-light-500 dark:text-dark-500">
              <span>Rp 0</span>
              <span>Rp {monthlyBudget.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Budget Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-xs font-medium text-light-600 dark:text-dark-400">Monthly Budget</span>
              </div>
              <p className="text-2xl font-bold text-light-800 dark:text-dark-100">
                Rp {monthlyBudget.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs font-medium text-light-600 dark:text-dark-400">Current Expenses</span>
              </div>
              <p className="text-2xl font-bold text-light-800 dark:text-dark-100">
                Rp {currentExpenses.toLocaleString('id-ID')}
              </p>
            </div>
            <div className={`glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group ${
              remaining < 0 ? 'border-2 border-red-500/50 bg-red-50/50 dark:bg-red-500/5' : ''
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                  remaining < 0 
                    ? 'bg-red-100 dark:bg-red-500/20' 
                    : 'bg-green-100 dark:bg-green-500/20'
                }`}>
                  {remaining < 0 ? (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <span className="text-xs font-medium text-light-600 dark:text-dark-400">Remaining</span>
              </div>
              <p className={`text-2xl font-bold ${
                remaining < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-light-800 dark:text-dark-100'
              }`}>
                Rp {Math.abs(remaining).toLocaleString('id-ID')}
                {remaining < 0 && <span className="text-sm ml-1">over</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Categories - Placeholder */}
        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Budget by Category
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Track spending across different categories
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
              Manage →
            </button>
          </div>
          <div className="text-center py-10 sm:py-12 lg:py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-light-400 dark:text-dark-600" />
            </div>
            <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
              No budget categories set up yet
            </p>
            <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
              Create categories to better track your spending
            </p>
            <button
              onClick={() => {
                // TODO: Open create category modal
                alert('Create category feature coming soon!')
              }}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
            >
              Create Category
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

