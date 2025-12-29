'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Tag, Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import { apiClient, Category } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '#3B82F6',
    category_type: 'expense',
  })

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCategories()
      setCategories(response.data)
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      toast.error(error.message || 'Gagal memuat categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await apiClient.createCategory({
        name: formData.name,
        icon: formData.icon || undefined,
        color: formData.color || undefined,
        category_type: formData.category_type,
      })
      toast.success('Kategori berhasil dibuat!')
      setIsAddModalOpen(false)
      setFormData({
        name: '',
        icon: '',
        color: '#3B82F6',
        category_type: 'expense',
      })
      fetchCategories()
    } catch (error: any) {
      console.error('Error creating category:', error)
      const errorMessage = error.error || error.message || 'Gagal membuat kategori'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '#3B82F6',
      category_type: category.category_type,
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return

    setIsSubmitting(true)

    try {
      await apiClient.updateCategory(selectedCategory.id, {
        name: formData.name,
        icon: formData.icon || undefined,
        color: formData.color || undefined,
        category_type: formData.category_type,
      })
      toast.success('Kategori berhasil diupdate!')
      setIsEditModalOpen(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (error: any) {
      console.error('Error updating category:', error)
      const errorMessage = error.error || error.message || 'Gagal update kategori'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      return
    }

    try {
      setDeletingId(id)
      await apiClient.deleteCategory(id)
      toast.success('Kategori berhasil dihapus!')
      fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      const errorMessage = error.error || error.message || 'Gagal menghapus kategori'
      toast.error(errorMessage)
    } finally {
      setDeletingId(null)
    }
  }

  const expenseCategories = categories.filter((cat) => cat.category_type === 'expense')
  const incomeCategories = categories.filter((cat) => cat.category_type === 'income')

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Categories 🏷️
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Kelola kategori untuk transaksi dan budget Anda
          </p>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setFormData({
                name: '',
                icon: '',
                color: '#3B82F6',
                category_type: 'expense',
              })
              setIsAddModalOpen(true)
            }}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-4" />
            <p className="text-light-500 dark:text-dark-500 text-sm">Memuat categories...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Expense Categories */}
            <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-light-800 dark:text-dark-100 mb-4">
                Kategori Pengeluaran
              </h2>
              {expenseCategories.length === 0 ? (
                <p className="text-light-500 dark:text-dark-500 text-sm text-center py-8">
                  Belum ada kategori pengeluaran
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expenseCategories.map((category) => (
                    <div
                      key={category.id}
                      className="glass rounded-lg p-4 border border-light-300 dark:border-dark-700 hover:border-primary-400 dark:hover:border-primary-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {category.icon && (
                            <span className="text-xl">{category.icon}</span>
                          )}
                          <h3 className="font-medium text-light-800 dark:text-dark-100">
                            {category.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-1.5 hover:bg-light-200 dark:hover:bg-dark-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-light-600 dark:text-dark-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={deletingId === category.id}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete"
                          >
                            {deletingId === category.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            )}
                          </button>
                        </div>
                      </div>
                      {category.color && (
                        <div
                          className="h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Income Categories */}
            <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-light-800 dark:text-dark-100 mb-4">
                Kategori Pendapatan
              </h2>
              {incomeCategories.length === 0 ? (
                <p className="text-light-500 dark:text-dark-500 text-sm text-center py-8">
                  Belum ada kategori pendapatan
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incomeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="glass rounded-lg p-4 border border-light-300 dark:border-dark-700 hover:border-primary-400 dark:hover:border-primary-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {category.icon && (
                            <span className="text-xl">{category.icon}</span>
                          )}
                          <h3 className="font-medium text-light-800 dark:text-dark-100">
                            {category.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-1.5 hover:bg-light-200 dark:hover:bg-dark-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-light-600 dark:text-dark-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={deletingId === category.id}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete"
                          >
                            {deletingId === category.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            )}
                          </button>
                        </div>
                      </div>
                      {category.color && (
                        <div
                          className="h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Tambah Kategori"
        >
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Nama Kategori *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Makanan, Transportasi, dll"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Icon (Emoji)
              </label>
              <Input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🍔"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Warna
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 rounded border border-light-300 dark:border-dark-700 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Tipe Kategori *
              </label>
              <select
                value={formData.category_type}
                onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                className="w-full px-3 py-2 bg-light-100 dark:bg-dark-800 border border-light-300 dark:border-dark-700 rounded-lg text-sm text-light-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pendapatan</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Buat Kategori'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Category Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedCategory(null)
          }}
          title="Edit Kategori"
        >
          <form onSubmit={handleUpdateCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Nama Kategori *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Makanan, Transportasi, dll"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Icon (Emoji)
              </label>
              <Input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🍔"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Warna
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 rounded border border-light-300 dark:border-dark-700 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
                Tipe Kategori *
              </label>
              <select
                value={formData.category_type}
                onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                className="w-full px-3 py-2 bg-light-100 dark:bg-dark-800 border border-light-300 dark:border-dark-700 rounded-lg text-sm text-light-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pendapatan</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedCategory(null)
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Update Kategori'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}




