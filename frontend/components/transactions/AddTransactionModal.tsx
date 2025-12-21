'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowUpRight, ArrowDownRight, Calendar, Tag, Wallet, ChevronDown } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { apiClient, Wallet as WalletType } from '@/lib/api'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  type?: 'income' | 'expense'
  onSuccess?: () => void
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  type = 'expense',
  onSuccess,
}: AddTransactionModalProps) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    wallet_id: '',
  })
  const [wallets, setWallets] = useState<WalletType[]>([])
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchWallets = useCallback(async () => {
    try {
      setIsLoadingWallets(true)
      const response = await apiClient.getWallets()
      if (response.success) {
        setWallets(response.data)
        // Set default wallet if available
        const defaultWallet = response.data.find(w => w.is_default)
        if (defaultWallet) {
          setFormData(prev => {
            // Only set if not already set
            if (!prev.wallet_id) {
              return { ...prev, wallet_id: defaultWallet.id }
            }
            return prev
          })
        }
      }
    } catch (error) {
      console.error('Error fetching wallets:', error)
    } finally {
      setIsLoadingWallets(false)
    }
  }, [])

  // Fetch wallets when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWallets()
    }
  }, [isOpen, fetchWallets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { apiClient } = await import('@/lib/api')
      
      await apiClient.createTransaction({
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        category: formData.category || undefined,
        date: formData.date,
        type: type,
        wallet_id: formData.wallet_id || undefined,
      })

      // Reset form
      const defaultWallet = wallets.find(w => w.is_default)
      setFormData({
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        wallet_id: defaultWallet?.id || '',
      })
      
      toast.success(type === 'income' ? 'Pendapatan berhasil ditambahkan! 💰' : 'Pengeluaran berhasil ditambahkan! 📝')
      onClose()
      
      // Call onSuccess callback if provided, otherwise reload page
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      toast.error(error.message || 'Gagal menambahkan transaksi')
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

  const categories = type === 'income'
    ? ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other']
    : ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'income' ? 'Add Income' : 'Add Expense'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Wallet Selection */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Wallet
            <span className="text-primary-500 ml-1">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 z-10">
              <Wallet className="w-4 h-4" />
            </div>
            {isLoadingWallets ? (
              <div className="w-full pl-10 pr-10 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-500 dark:text-dark-400">
                Loading wallets...
              </div>
            ) : (
              <>
                <select
                  name="wallet_id"
                  value={formData.wallet_id}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600 appearance-none cursor-pointer"
                >
                  <option value="">Select wallet</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.icon || '💳'} {wallet.name} {wallet.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Amount (Rp)
          </label>
          <Input
            type="number"
            name="amount"
            placeholder="0"
            value={formData.amount}
            onChange={handleChange}
            required
            icon={
              type === 'income' ? (
                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
              )
            }
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Description
          </label>
          <Input
            type="text"
            name="description"
            placeholder="Enter description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Category
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400">
              <Tag className="w-4 h-4" />
            </div>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Date
          </label>
          <Input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            icon={<Calendar className="w-4 h-4 text-light-500 dark:text-dark-400" />}
          />
        </div>

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
            {type === 'income' ? 'Add Income' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

