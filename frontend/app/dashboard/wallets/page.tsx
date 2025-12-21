'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Wallet, Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import AddWalletModal from '@/components/wallets/AddWalletModal'
import EditWalletModal from '@/components/wallets/EditWalletModal'
import { apiClient, Wallet as WalletType } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { useTheme } from '@/contexts/ThemeContext'

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletType[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const toast = useToast()
  const { theme } = useTheme()

  const fetchWallets = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getWallets()
      setWallets(response.data)
    } catch (error: any) {
      console.error('Error fetching wallets:', error)
      toast.error(error.message || 'Gagal memuat wallets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallets()
  }, [])

  const handleAddSuccess = () => {
    fetchWallets()
  }

  const handleEdit = (wallet: WalletType) => {
    setSelectedWallet(wallet)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    // Force refresh wallets to get updated icon
    await fetchWallets()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus wallet ini?')) {
      return
    }

    try {
      setDeletingId(id)
      await apiClient.deleteWallet(id)
      toast.success('Wallet berhasil dihapus! 🗑️')
      fetchWallets()
    } catch (error: any) {
      console.error('Error deleting wallet:', error)
      toast.error(error.message || 'Gagal menghapus wallet')
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getWalletTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      cash: 'Cash',
      bank: 'Bank',
      card: 'Card',
      'credit-card': 'Credit Card',
      paylater: 'PayLater',
      'e-wallet': 'E-Wallet',
      other: 'Other',
    }
    return types[type] || type
  }

  const isCreditWallet = (type: string) => {
    return type === 'credit-card' || type === 'paylater'
  }

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
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Your Wallets
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Track balances across different accounts
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Wallet</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
              <p className="text-light-500 dark:text-dark-500 text-sm">Loading wallets...</p>
            </div>
          ) : wallets.length === 0 ? (
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
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
              >
                Add Your First Wallet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {wallets.map((wallet) => {
                const walletColor = wallet.color || '#22c55e'
                // Different opacity for light and dark mode
                // Light mode: more visible (15% background, 40% border, 30% icon)
                // Dark mode: more subtle (10% background, 30% border, 25% icon)
                const bgOpacity = theme === 'light' ? 0.15 : 0.10
                const borderOpacity = theme === 'light' ? 0.40 : 0.30
                const iconOpacity = theme === 'light' ? 0.30 : 0.25
                
                return (
                <div
                  key={`${wallet.id}-${wallet.icon}-${wallet.color}`}
                  className="rounded-xl p-4 sm:p-6 border transition-all duration-200 hover:shadow-lg relative group overflow-hidden"
                  style={{
                    backgroundColor: hexToRgba(walletColor, bgOpacity),
                    borderColor: hexToRgba(walletColor, borderOpacity),
                  }}
                >
                  {/* Wallet Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{
                          backgroundColor: hexToRgba(walletColor, iconOpacity),
                        }}
                      >
                        {wallet.icon || '💳'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100">
                            {wallet.name}
                          </h3>
                          {wallet.is_default && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-light-500 dark:text-dark-500">
                          {getWalletTypeLabel(wallet.wallet_type)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-4">
                    <p className="text-xs text-light-500 dark:text-dark-500 mb-1">
                      {isCreditWallet(wallet.wallet_type) ? 'Used Credit' : 'Balance'}
                    </p>
                    <p className={`text-xl sm:text-2xl font-bold ${
                      wallet.balance < 0 || isCreditWallet(wallet.wallet_type)
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-light-800 dark:text-dark-100'
                    }`}>
                      {formatCurrency(Math.abs(wallet.balance))}
                    </p>
                    {isCreditWallet(wallet.wallet_type) && wallet.credit_limit && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-light-500 dark:text-dark-500">Credit Limit:</span>
                          <span className="text-light-700 dark:text-dark-300 font-medium">
                            {formatCurrency(wallet.credit_limit)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-light-500 dark:text-dark-500">Available:</span>
                          <span className={`font-medium ${
                            (wallet.credit_limit + wallet.balance) < (wallet.credit_limit * 0.2)
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {formatCurrency(wallet.credit_limit + wallet.balance)}
                          </span>
                        </div>
                        {/* Credit Usage Bar */}
                        <div className="mt-2 h-2 bg-light-200 dark:bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              (wallet.credit_limit + wallet.balance) < (wallet.credit_limit * 0.2)
                                ? 'bg-red-500'
                                : (wallet.credit_limit + wallet.balance) < (wallet.credit_limit * 0.5)
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, ((wallet.credit_limit + wallet.balance) / wallet.credit_limit) * 100))}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-light-200 dark:border-dark-800">
                    <button
                      onClick={() => handleEdit(wallet)}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-light-100 dark:hover:bg-dark-800 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(wallet.id)}
                      disabled={deletingId === wallet.id}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === wallet.id ? (
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddWalletModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      <EditWalletModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedWallet(null)
        }}
        wallet={selectedWallet}
        onSuccess={handleEditSuccess}
      />
    </DashboardLayout>
  )
}

