'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AddTransactionModal from '@/components/transactions/AddTransactionModal'
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import { apiClient, Transaction } from '@/lib/api'
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight, Calendar, Tag, Wallet, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

export default function TransactionsPage() {
  const toast = useToast()
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getTransactions()
      if (response.success) {
        setTransactions(response.data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleTransactionSuccess = () => {
    fetchTransactions()
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      await apiClient.deleteTransaction(transactionId)
      toast.success('Transaksi berhasil dihapus! 🗑️')
      fetchTransactions()
    } catch (error: any) {
      console.error('Error deleting transaction:', error)
      toast.error(error.message || 'Gagal menghapus transaksi')
    }
  }

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

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

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
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingTransaction(null)
        }}
        transaction={editingTransaction}
        onSuccess={handleTransactionSuccess}
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

        {/* Summary Cards */}
        {!isLoading && transactions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
            <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-green-200 dark:border-green-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                    Total Income
                  </span>
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>

            <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-red-200 dark:border-red-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                    Total Expense
                  </span>
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalExpense)}
              </p>
            </div>

            <div className={`glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border ${balance >= 0
              ? 'border-primary-200 dark:border-primary-800/50'
              : 'border-red-200 dark:border-red-800/50'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${balance >= 0
                    ? 'bg-primary-500/10 dark:bg-primary-500/20'
                    : 'bg-red-500/10 dark:bg-red-500/20'
                    }`}>
                    <Wallet className={`w-4 h-4 sm:w-5 sm:h-5 ${balance >= 0
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-red-600 dark:text-red-400'
                      }`} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                    Balance
                  </span>
                </div>
              </div>
              <p className={`text-lg sm:text-xl font-bold ${balance >= 0
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-red-600 dark:text-red-400'
                }`}>
                {balance < 0 ? '-' : ''}{formatCurrency(Math.abs(balance))}
              </p>
            </div>
          </div>
        )}

        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                All Transactions
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setIsIncomeModalOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="hidden sm:inline">Add Income</span>
                <span className="sm:hidden">Income</span>
              </button>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Expense</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center animate-pulse">
                <ArrowLeftRight className="w-8 h-8 text-light-400 dark:text-dark-600" />
              </div>
              <p className="text-light-500 dark:text-dark-500 text-sm font-medium">
                Loading transactions...
              </p>
            </div>
          ) : transactions.length === 0 ? (
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
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  onClick={() => setIsIncomeModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Add Income
                </button>
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Add Expense
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const isIncome = transaction.transaction_type === 'income'
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
                      <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 rounded-lg text-light-600 dark:text-dark-400 hover:bg-primary-500/10 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
                            title="Edit transaction"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 rounded-lg text-light-600 dark:text-dark-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

