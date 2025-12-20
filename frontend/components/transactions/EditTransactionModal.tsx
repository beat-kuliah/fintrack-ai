'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowUpRight, ArrowDownRight, Calendar, Tag, ChevronDown } from 'lucide-react'
import { apiClient, Transaction } from '@/lib/api'

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onSuccess?: () => void
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}: EditTransactionModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: '',
    type: 'expense' as 'income' | 'expense',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load transaction data when modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      setIsLoading(true)
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description || '',
        category: transaction.category_name || '',
        date: transaction.date,
        type: transaction.transaction_type === 'income' ? 'income' : 'expense',
      })
      setIsLoading(false)
    }
  }, [isOpen, transaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    setIsSubmitting(true)

    try {
      await apiClient.updateTransaction(transaction.id, {
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        category: formData.category || undefined,
        date: formData.date,
        type: formData.type,
      })

      onClose()

      // Call onSuccess callback if provided, otherwise reload page
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error updating transaction:', error)
      alert(error.message || 'Failed to update transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const categories = formData.type === 'income'
    ? ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other']
    : ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']

  if (!transaction) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${formData.type === 'income' ? 'Income' : 'Expense'}`}
      size="md"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-light-600 dark:text-dark-400">Loading transaction data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-light-700 dark:text-dark-300 mb-1.5 sm:mb-2">
              Transaction Type
              <span className="text-primary-500 ml-1">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600 appearance-none cursor-pointer"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Amount */}
          <Input
            label="Amount (Rp)"
            type="number"
            name="amount"
            placeholder="0"
            value={formData.amount}
            onChange={handleChange}
            required
            icon={
              formData.type === 'income' ? (
                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
              )
            }
          />

          {/* Description */}
          <Input
            label="Description"
            type="text"
            name="description"
            placeholder="Enter description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          {/* Category */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-light-700 dark:text-dark-300 mb-1.5 sm:mb-2">
              Category
              <span className="text-primary-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 z-10">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600 appearance-none cursor-pointer"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 pointer-events-none">
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Date */}
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            icon={<Calendar className="w-4 h-4 text-light-500 dark:text-dark-400" />}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={isSubmitting}
            >
              Update Transaction
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}


