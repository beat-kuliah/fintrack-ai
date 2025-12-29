'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Wallet, AlertCircle, CheckCircle2, TrendingDown, Plus, Copy, Calendar, Edit2, Trash2, Loader2, Tag } from 'lucide-react'
import { apiClient, Budget, Category } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function BudgetingPage() {
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    month: selectedMonth,
    year: selectedYear,
    is_active: true,
    alert_threshold: 80,
  })

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getBudgets({
        month: selectedMonth,
        year: selectedYear,
      })
      if (response.success) {
        setBudgets(response.data)
      }
    } catch (error: any) {
      console.error('Error fetching budgets:', error)
      const errorMessage = error.error || error.message || 'Gagal memuat budget'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear, toast])

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true)
      const response = await apiClient.getCategories()
      if (response.success) {
        // Filter hanya kategori expense untuk budget
        const expenseCategories = response.data.filter(cat => cat.category_type === 'expense')
        setCategories(expenseCategories)
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      // Don't show error toast, just log it
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    fetchBudgets()
    fetchCategories()
  }, [fetchBudgets, fetchCategories])

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate amount
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Jumlah budget harus lebih besar dari 0')
        setIsSubmitting(false)
        return
      }

      // Handle category_id - convert empty string to null/undefined
      const categoryId = formData.category_id && formData.category_id.trim() !== '' 
        ? formData.category_id 
        : undefined

      await apiClient.createBudget({
        category_id: categoryId,
        amount: amount,
        month: formData.month,
        year: formData.year,
        is_active: formData.is_active,
        alert_threshold: formData.alert_threshold,
      })
      toast.success('Budget berhasil dibuat!')
      setIsCreateModalOpen(false)
      setFormData({
        category_id: '',
        amount: '',
        month: selectedMonth,
        year: selectedYear,
        is_active: true,
        alert_threshold: 80,
      })
      fetchBudgets()
    } catch (error: any) {
      console.error('Error creating budget:', error)
      // Handle both error.message and error.error (from backend)
      const errorMessage = error.error || error.message || 'Gagal membuat budget'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await apiClient.copyBudget({
        source_month: formData.month,
        source_year: formData.year,
        target_month: selectedMonth,
        target_year: selectedYear,
      })
      toast.success(response.message || 'Budget berhasil di-copy!')
      setIsCopyModalOpen(false)
      fetchBudgets()
    } catch (error: any) {
      console.error('Error copying budget:', error)
      const errorMessage = error.error || error.message || 'Gagal copy budget'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBudget) return

    setIsSubmitting(true)

    try {
      await apiClient.updateBudget(editingBudget.id, {
        category_id: formData.category_id || null,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        month: formData.month,
        year: formData.year,
        is_active: formData.is_active,
        alert_threshold: formData.alert_threshold,
      })
      toast.success('Budget berhasil diupdate!')
      setIsEditModalOpen(false)
      setEditingBudget(null)
      fetchBudgets()
    } catch (error: any) {
      console.error('Error updating budget:', error)
      const errorMessage = error.error || error.message || 'Gagal update budget'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus budget ini?')) return

    try {
      await apiClient.deleteBudget(id)
      toast.success('Budget berhasil dihapus!')
      fetchBudgets()
    } catch (error: any) {
      console.error('Error deleting budget:', error)
      const errorMessage = error.error || error.message || 'Gagal menghapus budget'
      toast.error(errorMessage)
    }
  }

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      category_id: budget.category_id || '',
      amount: budget.amount.toString(),
      month: budget.month,
      year: budget.year,
      is_active: budget.is_active,
      alert_threshold: budget.alert_threshold || 80,
    })
    setIsEditModalOpen(true)
  }

  // Calculate totals
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalUsed = budgets.reduce((sum, b) => sum + (b.used_amount || 0), 0)
  const totalRemaining = totalBudget - totalUsed
  const percentageUsed = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0
  const isOverBudget = totalUsed > totalBudget

  // Get previous month/year for copy
  const getPreviousMonth = () => {
    const prevDate = new Date(selectedYear, selectedMonth - 2, 1)
    return {
      month: prevDate.getMonth() + 1,
      year: prevDate.getFullYear(),
    }
  }

  const prevMonth = getPreviousMonth()

  // Month names
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Budgeting 💰
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Kelola budget bulanan Anda dan pantau pengeluaran
          </p>
        </div>

        {/* Month/Year Selector */}
        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 bg-light-100 dark:bg-dark-800 border border-light-300 dark:border-dark-700 rounded-lg text-sm font-medium text-light-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 bg-light-100 dark:bg-dark-800 border border-light-300 dark:border-dark-700 rounded-lg text-sm font-medium text-light-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFormData({
                    category_id: '',
                    amount: '',
                    month: prevMonth.month,
                    year: prevMonth.year,
                    is_active: true,
                    alert_threshold: 80,
                  })
                  setIsCopyModalOpen(true)
                }}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 flex items-center gap-2"
                disabled={isLoading}
              >
                <Copy className="w-4 h-4" />
                Copy dari Bulan Sebelumnya
              </button>
              <button
                onClick={() => {
                  setFormData({
                    category_id: '',
                    amount: '',
                    month: selectedMonth,
                    year: selectedYear,
                    is_active: true,
                    alert_threshold: 80,
                  })
                  setIsCreateModalOpen(true)
                }}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 flex items-center gap-2"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
                Buat Budget
              </button>
            </div>
          </div>
        </div>

        {/* Budget Overview Card */}
        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 mb-5 sm:mb-6 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Budget Overview - {monthNames[selectedMonth - 1]} {selectedYear}
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Ringkasan budget dan pengeluaran bulan ini
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
              <span>Rp {totalBudget.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Budget Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-xs font-medium text-light-600 dark:text-dark-400">Total Budget</span>
              </div>
              <p className="text-2xl font-bold text-light-800 dark:text-dark-100">
                Rp {totalBudget.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs font-medium text-light-600 dark:text-dark-400">Pengeluaran</span>
              </div>
              <p className="text-2xl font-bold text-light-800 dark:text-dark-100">
                Rp {totalUsed.toLocaleString('id-ID')}
              </p>
            </div>
            <div className={`glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group ${
              totalRemaining < 0 ? 'border-2 border-red-500/50 bg-red-50/50 dark:bg-red-500/5' : ''
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                  totalRemaining < 0 
                    ? 'bg-red-100 dark:bg-red-500/20' 
                    : 'bg-green-100 dark:bg-green-500/20'
                }`}>
                  {totalRemaining < 0 ? (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <span className="text-xs font-medium text-light-600 dark:text-dark-400">Sisa</span>
              </div>
              <p className={`text-2xl font-bold ${
                totalRemaining < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-light-800 dark:text-dark-100'
              }`}>
                Rp {Math.abs(totalRemaining).toLocaleString('id-ID')}
                {totalRemaining < 0 && <span className="text-sm ml-1">over</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Categories */}
        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Budget by Category
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Detail budget per kategori
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-4" />
              <p className="text-light-500 dark:text-dark-500 text-sm">Memuat budget...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-light-400 dark:text-dark-600" />
              </div>
              <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
                Belum ada budget untuk bulan ini
              </p>
              <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
                Buat budget baru atau copy dari bulan sebelumnya
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const usagePercentage = budget.usage_percentage || 0
                const isOver = budget.is_over_budget || false
                const shouldAlert = budget.should_alert || false

                return (
                  <div
                    key={budget.id}
                    className={`glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 ${
                      isOver ? 'border-2 border-red-500/50 bg-red-50/50 dark:bg-red-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold text-light-800 dark:text-dark-100">
                            {budget.category_name || 'Total Budget'}
                          </h3>
                          {shouldAlert && (
                            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium rounded">
                              Alert
                            </span>
                          )}
                          {isOver && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                              Over Budget
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-light-600 dark:text-dark-400">
                          <span>Budget: Rp {budget.amount.toLocaleString('id-ID')}</span>
                          <span>•</span>
                          <span>Terpakai: Rp {(budget.used_amount || 0).toLocaleString('id-ID')}</span>
                          <span>•</span>
                          <span>Sisa: Rp {(budget.remaining_amount || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(budget)}
                          className="p-2 hover:bg-light-200 dark:hover:bg-dark-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-light-600 dark:text-dark-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(budget.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-light-200 dark:bg-dark-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isOver
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : shouldAlert
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                            : 'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-light-500 dark:text-dark-500">
                      <span>{usagePercentage.toFixed(1)}% terpakai</span>
                      {budget.alert_threshold && (
                        <span>Alert: {budget.alert_threshold}%</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Budget Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Budget Baru"
      >
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
              Kategori (opsional)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 z-10">
                <Tag className="w-4 h-4" />
              </div>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-light-100 dark:bg-dark-800 border border-light-300 dark:border-dark-700 rounded-lg text-sm text-light-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
              >
                <option value="">-- Total Budget (Semua Kategori) --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon && <span>{category.icon} </span>}
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-light-500 dark:text-dark-500 mt-1">
              Pilih kategori untuk budget spesifik, atau kosongkan untuk total budget bulanan
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
              Jumlah Budget *
            </label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              required
              min="0.01"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Bulan
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-light-100 dark:bg-dark-800 border border-light-300 dark:border-dark-700 rounded-lg text-sm text-light-800 dark:text-dark-100"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Tahun
              </label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
                min="2000"
                max="3000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
              Alert Threshold (%)
            </label>
            <Input
              type="number"
              value={formData.alert_threshold}
              onChange={(e) => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) })}
              min="0"
              max="100"
            />
            <p className="text-xs text-light-500 dark:text-dark-500 mt-1">
              Alert akan muncul saat budget mencapai persentase ini
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-light-700 dark:text-dark-300">
              Aktif
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Buat Budget'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Copy Budget Modal */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Copy Budget dari Bulan Sebelumnya"
      >
        <form onSubmit={handleCopyBudget} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Budget dari <strong>{monthNames[formData.month - 1]} {formData.year}</strong> akan di-copy ke{' '}
              <strong>{monthNames[selectedMonth - 1]} {selectedYear}</strong>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Bulan Sumber
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-light-100 dark:bg-dark-800 border border-light-300 dark:border-dark-700 rounded-lg text-sm text-light-800 dark:text-dark-100"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Tahun Sumber
              </label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
                min="2000"
                max="3000"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCopyModalOpen(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Mengcopy...' : 'Copy Budget'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingBudget(null)
        }}
        title="Edit Budget"
      >
        {editingBudget && (
          <form onSubmit={handleUpdateBudget} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Kategori
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400">
                  <Tag className="w-4 h-4" />
                </div>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-light-100 dark:bg-dark-800 border border-light-300 dark:border-dark-700 rounded-lg text-sm text-light-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                >
                  <option value="">-- Total Budget (Semua Kategori) --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon && <span>{category.icon} </span>}
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-light-500 dark:text-dark-500 mt-1">
                Pilih kategori untuk budget spesifik, atau kosongkan untuk total budget bulanan
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Jumlah Budget *
              </label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                  Bulan
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-light-100 dark:bg-dark-800 border border-light-300 dark:border-dark-700 rounded-lg text-sm text-light-800 dark:text-dark-100"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                  Tahun
                </label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                  min="2000"
                  max="3000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Alert Threshold (%)
              </label>
              <Input
                type="number"
                value={formData.alert_threshold}
                onChange={(e) => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) })}
                min="0"
                max="100"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="edit_is_active" className="text-sm text-light-700 dark:text-dark-300">
                Aktif
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingBudget(null)
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Update Budget'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  )
}
