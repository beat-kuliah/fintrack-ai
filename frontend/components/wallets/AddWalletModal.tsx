'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Wallet } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api'

interface AddWalletModalProps {
  isOpen: boolean
  onClose: () => void
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

export default function AddWalletModal({
  isOpen,
  onClose,
  onSuccess,
}: AddWalletModalProps) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    name: '',
    wallet_type: 'cash',
    icon: '💵',
    color: '#22c55e',
    credit_limit: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await apiClient.createWallet({
        name: formData.name,
        wallet_type: formData.wallet_type,
        balance: 0, // Always start with 0 balance
        icon: formData.icon,
        color: formData.color,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : undefined,
      })

      // Reset form
      setFormData({
        name: '',
        wallet_type: 'cash',
        icon: '💵',
        color: '#22c55e',
        credit_limit: '',
      })

      toast.success('Wallet berhasil ditambahkan! 💳')
      onClose()

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Error creating wallet:', error)
      toast.error(error.message || 'Gagal menambahkan wallet')
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Wallet"
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
            Add Wallet
          </Button>
        </div>
      </form>
    </Modal>
  )
}

