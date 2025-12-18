'use client'

import { Wallet, TrendingUp, PiggyBank, Target } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  type: 'login' | 'register'
}

export default function AuthLayout({ children, title, subtitle, type }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 bg-mesh noise flex flex-col lg:flex-row transition-colors duration-300">
      {/* Theme Toggle - Fixed top right */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 xl:top-8 xl:right-8 z-50">
        <ThemeToggle />
      </div>
      
      {/* Mobile Header - Fixed at top */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-light-200 dark:border-dark-800 px-4 py-3 h-14">
        <div className="flex items-center w-full h-full">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold font-display whitespace-nowrap">
              <span className="text-gradient">Fin</span>
              <span className="text-light-800 dark:text-dark-100">Track</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-8 xl:p-12 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-500/10 dark:bg-primary-500/15 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-accent-sky/8 dark:bg-accent-sky/12 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-accent-aqua/8 dark:bg-accent-aqua/12 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-all duration-300">
              <Wallet className="w-5 h-5 xl:w-6 xl:h-6 text-white" />
            </div>
            <span className="text-xl xl:text-2xl font-bold font-display">
              <span className="text-gradient">Fin</span>
              <span className="text-light-800 dark:text-dark-100">Track</span>
            </span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-6 xl:space-y-8">
          <h1 className="text-3xl xl:text-5xl font-bold font-display leading-tight">
            <span className="text-light-800 dark:text-dark-100">Kelola Duit Lo,</span>
            <br />
            <span className="text-gradient">Raih Goals Lo</span>
          </h1>
          <p className="text-base xl:text-lg text-light-600 dark:text-dark-400 max-w-md leading-relaxed">
            Tracking keuangan yang simple, visual, dan bikin lo aware sama spending habits. 
            No more bokek di akhir bulan! 💸
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-3 xl:gap-4 mt-6 xl:mt-8">
            <FeatureCard
              icon={<TrendingUp className="w-4 h-4 xl:w-5 xl:h-5" />}
              title="Track Realtime"
              description="Pantau cashflow lo kapan aja"
            />
            <FeatureCard
              icon={<PiggyBank className="w-4 h-4 xl:w-5 xl:h-5" />}
              title="Smart Saving"
              description="Auto nabung buat goals lo"
            />
            <FeatureCard
              icon={<Target className="w-4 h-4 xl:w-5 xl:h-5" />}
              title="Set Goals"
              description="Dari iPhone baru sampe liburan"
            />
            <FeatureCard
              icon={<Wallet className="w-4 h-4 xl:w-5 xl:h-5" />}
              title="Multi Wallet"
              description="GoPay, OVO, Dana? Semua bisa!"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-light-500 dark:text-dark-500 text-sm">
          © 2024 FinTrack. Made with 💙 for Gen Z
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col lg:items-center justify-center p-4 sm:p-5 lg:p-8 xl:p-12 w-full pt-20 sm:pt-20 lg:pt-4 pb-4 sm:pb-6 lg:pb-0 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md xl:max-w-lg mx-auto">

          {/* Form Container */}
          <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-xl sm:shadow-2xl shadow-black/5 dark:shadow-black/20 animate-fade-in">
            <div className="text-center mb-5 sm:mb-6 lg:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold font-display text-light-900 dark:text-dark-50 mb-1.5 sm:mb-2">
                {title}
              </h2>
              <p className="text-sm sm:text-base text-light-600 dark:text-dark-400">{subtitle}</p>
            </div>

            {children}

            {/* Switch Auth Type */}
            <div className="mt-6 sm:mt-8 text-center text-sm sm:text-base text-light-600 dark:text-dark-400">
              {type === 'login' ? (
                <p>
                  Belum punya akun?{' '}
                  <Link
                    href="/register"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    Daftar sekarang
                  </Link>
                </p>
              ) : (
                <p>
                  Sudah punya akun?{' '}
                  <Link
                    href="/login"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    Masuk di sini
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="glass-light rounded-lg xl:rounded-xl p-3 xl:p-4 group hover:bg-light-200/50 dark:hover:bg-white/10 transition-all duration-300 cursor-default">
      <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-2 xl:mb-3 group-hover:bg-primary-200 dark:group-hover:bg-primary-500/30 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-sm xl:text-base text-light-800 dark:text-dark-100 mb-0.5 xl:mb-1">{title}</h3>
      <p className="text-xs xl:text-sm text-light-600 dark:text-dark-400">{description}</p>
    </div>
  )
}
