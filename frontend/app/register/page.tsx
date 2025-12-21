'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Rocket, Check, X } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, login } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const passwordRequirements = [
    { label: 'Minimal 8 karakter', check: formData.password.length >= 8 },
    { label: 'Mengandung huruf besar', check: /[A-Z]/.test(formData.password) },
    { label: 'Mengandung angka', check: /[0-9]/.test(formData.password) },
  ]

  const validateForm = () => {
    if (!formData.name) {
      toast.error('Nama wajib diisi')
      return false
    } else if (formData.name.length < 2) {
      toast.error('Nama minimal 2 karakter')
      return false
    }

    if (!formData.username) {
      toast.error('Username wajib diisi')
      return false
    } else if (formData.username.length < 3) {
      toast.error('Username minimal 3 karakter')
      return false
    } else if (formData.username.length > 30) {
      toast.error('Username maksimal 30 karakter')
      return false
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error('Username hanya boleh mengandung huruf, angka, dan underscore')
      return false
    }

    if (!formData.email) {
      toast.error('Email wajib diisi')
      return false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Format email tidak valid')
      return false
    }

    if (!formData.password) {
      toast.error('Password wajib diisi')
      return false
    } else if (formData.password.length < 8) {
      toast.error('Password minimal 8 karakter')
      return false
    } else if (!/[A-Z]/.test(formData.password)) {
      toast.error('Password harus mengandung huruf besar')
      return false
    } else if (!/[0-9]/.test(formData.password)) {
      toast.error('Password harus mengandung angka')
      return false
    }

    if (!formData.confirmPassword) {
      toast.error('Konfirmasi password wajib diisi')
      return false
    } else if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok')
      return false
    }

    if (!agreedToTerms) {
      toast.error('Kamu harus setuju dengan syarat & ketentuan')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await apiClient.register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })
      
      // Store token and update auth context
      login(response.token, response.user)
      
      // Show success toast
      toast.success('Registrasi berhasil! Selamat bergabung! 🎉')
      
      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || 'Terjadi kesalahan saat registrasi'
      
      // Show error toast
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Yuk, Gabung! 🚀"
      subtitle="Buat akun FinTrack gratis"
      type="register"
    >
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <Input
          label="Nama Lengkap"
          type="text"
          name="name"
          placeholder="Nama lo siapa?"
          value={formData.name}
          onChange={handleChange}
          icon={<User size={20} />}
          required
        />

        <Input
          label="Username"
          type="text"
          name="username"
          placeholder="username_lo"
          value={formData.username}
          onChange={handleChange}
          icon={<User size={20} />}
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={handleChange}
          icon={<Mail size={20} />}
          required
        />

        <div>
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Buat password yang kuat"
            value={formData.password}
            onChange={handleChange}
            icon={<Lock size={20} />}
            required
          />
          
          {/* Password Requirements */}
          {formData.password && (
            <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5 animate-slide-down">
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs transition-colors ${
                    req.check ? 'text-primary-600 dark:text-primary-400' : 'text-light-500 dark:text-dark-500'
                  }`}
                >
                  {req.check ? (
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-light-400 dark:text-dark-600" />
                  )}
                  {req.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Konfirmasi Password"
          type="password"
          name="confirmPassword"
          placeholder="Ulangi password lo"
          value={formData.confirmPassword}
          onChange={handleChange}
          icon={<Lock size={20} />}
          required
        />

        {/* Terms & Conditions */}
        <div className="pt-1 sm:pt-2">
          <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked)
              }}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 rounded border-light-400 dark:border-dark-600 bg-light-100 dark:bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-light-600 dark:text-dark-400 group-hover:text-light-700 dark:group-hover:text-dark-300 transition-colors leading-relaxed">
              Gue setuju sama{' '}
              <a href="#" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 underline">
                Syarat & Ketentuan
              </a>{' '}
              dan{' '}
              <a href="#" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 underline">
                Kebijakan Privasi
              </a>{' '}
              FinTrack
            </span>
          </label>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          className="mt-3 sm:mt-4"
        >
          <span className="flex items-center gap-2">
            Daftar Sekarang
            <Rocket className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </span>
        </Button>
      </form>

      {/* Social Login Divider */}
      <div className="relative my-5 sm:my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-light-300 dark:border-dark-700"></div>
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm">
          <span className="px-3 sm:px-4 bg-white dark:bg-dark-800/50 text-light-500 dark:text-dark-500">atau daftar dengan</span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl hover:bg-light-200 dark:hover:bg-dark-700 hover:border-light-400 dark:hover:border-dark-600 transition-all duration-300 group"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
            <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
            <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
            <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
          </svg>
          <span className="text-light-700 dark:text-dark-300 group-hover:text-light-900 dark:group-hover:text-dark-100 transition-colors text-xs sm:text-sm font-medium">
            Google
          </span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl hover:bg-light-200 dark:hover:bg-dark-700 hover:border-light-400 dark:hover:border-dark-600 transition-all duration-300 group"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-light-700 dark:text-dark-300 group-hover:text-light-900 dark:group-hover:text-dark-100 transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="text-light-700 dark:text-dark-300 group-hover:text-light-900 dark:group-hover:text-dark-100 transition-colors text-xs sm:text-sm font-medium">
            GitHub
          </span>
        </button>
      </div>
    </AuthLayout>
  )
}
