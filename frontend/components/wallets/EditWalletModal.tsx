'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Wallet } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { apiClient, Wallet as WalletType } from '@/lib/api'

interface EditWalletModalProps {
  isOpen: boolean
  onClose: () => void
  wallet: WalletType | null
  onSuccess?: () => void
}

const walletTypes = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank', label: 'Bank', icon: '🏦' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'credit-card', label: 'Credit Card', icon: '💳' },
  { value: 'paylater', label: 'PayLater', icon: '📋' },
  { value: 'e-wallet', label: 'E-Wallet', icon: '📱' },
  { value: 'other', label: 'Other', icon: '💼' },
]

const defaultIcons = ['💵', '🏦', '💳', '📱', '💰', '💎', '🎯', '⭐']
const defaultColors = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
]

export default function EditWalletModal({
  isOpen,
  onClose,
  wallet,
  onSuccess,
}: EditWalletModalProps) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    name: '',
    wallet_type: 'cash',
    icon: '💵',
    color: '#22c55e',
    credit_limit: '',
    is_default: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (wallet) {
      setFormData({
        name: wallet.name,
        wallet_type: wallet.wallet_type,
        icon: wallet.icon || '💵',
        color: wallet.color || '#22c55e',
        credit_limit: wallet.credit_limit?.toString() || '',
        is_default: wallet.is_default || false,
      })
    }
  }, [wallet])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet) return

    setIsSubmitting(true)

    try {
      // Always send icon and color - they should always have values from form
      const response = await apiClient.updateWallet(wallet.id, {
        name: formData.name,
        wallet_type: formData.wallet_type,
        // Balance tidak bisa diubah melalui edit - hanya melalui transaksi
        icon: formData.icon,
        color: formData.color,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : undefined,
        is_default: formData.is_default,
      })


      toast.success('Wallet berhasil diperbarui! ✅')
      
      // Close modal first
      onClose()

      // Then refresh data
      if (onSuccess) {
        // Add small delay to ensure modal is closed before refresh
        setTimeout(() => {
          onSuccess()
        }, 100)
      }
    } catch (error: any) {
      console.error('Error updating wallet:', error)
      toast.error(error.message || 'Gagal memperbarui wallet')
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

  if (!wallet) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Wallet"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <Input
            label="Wallet Name"
            type="text"
            name="name"
            placeholder="e.g., Main Wallet, Savings"
            value={formData.name}
            onChange={handleChange}
            required
            icon={<Wallet className="w-4 h-4 text-light-500 dark:text-dark-400" />}
          />
        </div>

        {/* Wallet Type */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Wallet Type
            <span className="text-primary-500 ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {walletTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, wallet_type: type.value })}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200
                  ${formData.wallet_type === type.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-light-300 dark:border-dark-700 bg-light-100 dark:bg-dark-800/50 hover:border-light-400 dark:hover:border-dark-600'
                  }
                `}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-xs font-medium text-light-700 dark:text-dark-300">
                  {type.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Balance Info - Read Only */}
        {wallet && (
          <div className="p-4 rounded-lg bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700">
            <p className="text-xs text-light-500 dark:text-dark-500 mb-1">Current Balance</p>
            <p className="text-lg font-semibold text-light-800 dark:text-dark-100">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(wallet.balance)}
            </p>
            <p className="text-xs text-light-400 dark:text-dark-600 mt-1">
              Balance hanya dapat diubah melalui transaksi
            </p>
          </div>
        )}

        {/* Credit Limit - Only for credit-card and paylater */}
        {(formData.wallet_type === 'credit-card' || formData.wallet_type === 'paylater') && (
          <div>
            <Input
              label="Credit Limit (Rp)"
              type="number"
              name="credit_limit"
              placeholder="0"
              value={formData.credit_limit}
              onChange={handleChange}
              icon={<Wallet className="w-4 h-4 text-light-500 dark:text-dark-400" />}
            />
            <p className="text-xs text-light-500 dark:text-dark-500 mt-1">
              Maksimal limit kredit untuk wallet ini
            </p>
          </div>
        )}

        {/* Icon */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {defaultIcons.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData({ ...formData, icon })}
                className={`
                  w-10 h-10 rounded-lg text-xl flex items-center justify-center
                  transition-all duration-200
                  ${formData.icon === icon
                    ? 'bg-primary-500 text-white scale-110'
                    : 'bg-light-100 dark:bg-dark-800/50 hover:bg-light-200 dark:hover:bg-dark-700'
                  }
                `}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {defaultColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`
                  w-10 h-10 rounded-lg transition-all duration-200
                  ${formData.color === color
                    ? 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                    : 'hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Set as Default */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700">
          <input
            type="checkbox"
            id="is_default"
            checked={formData.is_default}
            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            className="w-4 h-4 rounded border-light-300 dark:border-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-2"
          />
          <label htmlFor="is_default" className="flex-1 cursor-pointer">
            <div className="text-sm font-medium text-light-800 dark:text-dark-100">
              Set as Default Wallet
            </div>
            <div className="text-xs text-light-500 dark:text-dark-500 mt-0.5">
              Wallet ini akan digunakan secara otomatis saat membuat transaksi tanpa memilih wallet
            </div>
          </label>
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
            Update Wallet
          </Button>
        </div>
      </form>
    </Modal>
  )
}

