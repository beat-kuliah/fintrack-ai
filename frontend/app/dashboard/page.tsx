'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AddTransactionModal from '@/components/transactions/AddTransactionModal'
import MonthlyIncomeChart from '@/components/charts/MonthlyIncomeChart'
import CategoryPieChart from '@/components/charts/CategoryPieChart'
import { apiClient, Transaction } from '@/lib/api'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Calendar, Tag } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<Array<{ month: number; year: number; income: number; expense: number }>>([])
  const [categoryData, setCategoryData] = useState<Array<{ name: string; icon?: string; color?: string; total: number }>>([])
  const [isChartsLoading, setIsChartsLoading] = useState(true)

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getTransactions({ limit: 10 })
      if (response.success) {
        setTransactions(response.data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChartsData = async () => {
    try {
      setIsChartsLoading(true)
      const [monthlyResponse, categoryResponse] = await Promise.all([
        apiClient.getMonthlyStats(),
        apiClient.getExpensesByCategory(),
      ])

      if (monthlyResponse.success) {
        setMonthlyData(monthlyResponse.data)
      }

      if (categoryResponse.success) {
        setCategoryData(categoryResponse.data)
      }
    } catch (error) {
      console.error('Error fetching charts data:', error)
    } finally {
      setIsChartsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
    fetchChartsData()
  }, [])

  const handleTransactionSuccess = () => {
    fetchTransactions()
    fetchChartsData()
  }

  return (
    <DashboardLayout>
      <AddTransactionModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        type="income"
        onSuccess={handleTransactionSuccess}
      />
      <AddTransactionModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        type="expense"
        onSuccess={handleTransactionSuccess}
      />
      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        type="expense"
        onSuccess={handleTransactionSuccess}
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
        {(() => {
          const totalIncome = transactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)

          const totalExpense = transactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)

          const balance = totalIncome - totalExpense
          const savings = balance

          const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(amount)
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-5 sm:mb-6">
              <StatCard
                title="Total Balance"
                value={formatCurrency(balance)}
                icon={<Wallet className="w-5 h-5 sm:w-6 sm:h-6" />}
                trend={balance >= 0 ? '+0%' : '-0%'}
                trendUp={balance >= 0}
              />
              <StatCard
                title="Income"
                value={formatCurrency(totalIncome)}
                icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
                trend="+0%"
                trendUp={true}
              />
              <StatCard
                title="Expenses"
                value={formatCurrency(totalExpense)}
                icon={<TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />}
                trend="+0%"
                trendUp={false}
              />
              <StatCard
                title="Savings"
                value={formatCurrency(savings)}
                icon={<ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />}
                trend={savings >= 0 ? '+0%' : '-0%'}
                trendUp={savings >= 0}
              />
            </div>
          )
        })()}

        {/* Quick Add Transactions */}
        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Quick Add
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Add income or expense quickly
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className="flex items-center justify-center gap-3 p-4 sm:p-5 glass-light rounded-xl hover:bg-green-500/10 dark:hover:bg-green-500/20 transition-all duration-300 group hover:shadow-md hover:shadow-green-500/10 hover:-translate-y-1 active:translate-y-0 border border-green-200/50 dark:border-green-800/50"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-500/30 dark:group-hover:bg-green-500/40 group-hover:scale-110 transition-all duration-300">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-light-800 dark:text-dark-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  Add Income
                </p>
                <p className="text-xs text-light-500 dark:text-dark-500">
                  Record your income
                </p>
              </div>
            </button>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center justify-center gap-3 p-4 sm:p-5 glass-light rounded-xl hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-300 group hover:shadow-md hover:shadow-red-500/10 hover:-translate-y-1 active:translate-y-0 border border-red-200/50 dark:border-red-800/50"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/20 dark:bg-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:bg-red-500/30 dark:group-hover:bg-red-500/40 group-hover:scale-110 transition-all duration-300">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-light-800 dark:text-dark-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  Add Expense
                </p>
                <p className="text-xs text-light-500 dark:text-dark-500">
                  Record your expense
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-5 sm:mb-6">
          {/* Monthly Income Chart */}
          <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7">
            <div className="mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Income & Expense Trend
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Track your financial trends over time
              </p>
            </div>
            {isChartsLoading ? (
              <div className="h-[300px] sm:h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-500 mx-auto mb-2"></div>
                  <p className="text-sm text-light-500 dark:text-dark-500">Loading chart...</p>
                </div>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="h-[300px] sm:h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-light-500 dark:text-dark-500 text-sm">
                    No data available yet
                  </p>
                  <p className="text-light-400 dark:text-dark-600 text-xs mt-1">
                    Add transactions to see your trends
                  </p>
                </div>
              </div>
            ) : (
              <MonthlyIncomeChart data={monthlyData} />
            )}
          </div>

          {/* Category Pie Chart */}
          <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7">
            <div className="mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Expense by Category
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                This month's spending breakdown
              </p>
            </div>
            {isChartsLoading ? (
              <div className="h-[300px] sm:h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-500 mx-auto mb-2"></div>
                  <p className="text-sm text-light-500 dark:text-dark-500">Loading chart...</p>
                </div>
              </div>
            ) : (
              <CategoryPieChart data={categoryData} />
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100">
              Recent Transactions
            </h2>
            {transactions.length > 0 && (
              <button
                onClick={() => router.push('/dashboard/transactions')}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
              >
                View All →
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8 sm:py-12 lg:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center animate-pulse">
                <ArrowLeftRight className="w-8 h-8 text-light-400 dark:text-dark-600" />
              </div>
              <p className="text-light-500 dark:text-dark-500 text-sm sm:text-base font-medium">
                Loading transactions...
              </p>
            </div>
          ) : transactions.length === 0 ? (
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
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => {
                const isIncome = transaction.transaction_type === 'income'
                const formatCurrency = (amount: number) => {
                  return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(amount)
                }
                const formatDate = (dateString: string) => {
                  try {
                    const date = new Date(dateString)
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    const day = date.getDate()
                    const month = months[date.getMonth()]
                    const year = date.getFullYear()
                    return `${month} ${day}, ${year}`
                  } catch {
                    return dateString
                  }
                }
                return (
                  <div
                    key={transaction.id}
                    className="glass-light rounded-lg sm:rounded-xl p-4 sm:p-5 border border-light-200 dark:border-dark-800 hover:border-primary-300 dark:hover:border-primary-700/50 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome
                              ? 'bg-green-500/10 dark:bg-green-500/20'
                              : 'bg-red-500/10 dark:bg-red-500/20'
                            }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm sm:text-base font-semibold text-light-800 dark:text-dark-100 truncate">
                              {transaction.description || 'No description'}
                            </h3>
                            {transaction.category_name && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-light-100 dark:bg-dark-800 text-xs text-light-600 dark:text-dark-400">
                                <Tag className="w-3 h-3" />
                                {transaction.category_name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-light-500 dark:text-dark-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(transaction.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p
                          className={`text-base sm:text-lg font-bold ${isIncome
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                            }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${trendUp
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

