'use client'

import Link from 'next/link'
import { Wallet, ArrowRight, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 bg-mesh noise transition-colors duration-300">
      {/* Navigation - Compact on mobile */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-light-200 dark:border-dark-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-all duration-300">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold font-display">
                <span className="text-gradient">Fin</span>
                <span className="text-light-800 dark:text-dark-100">Track</span>
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Link
                href="/login"
                className="hidden sm:block px-4 py-2 text-light-600 dark:text-dark-300 hover:text-light-900 dark:hover:text-dark-100 font-medium transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 sm:px-5 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300"
              >
                <span className="hidden sm:inline">Daftar Gratis</span>
                <span className="sm:hidden">Daftar</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 sm:pt-20 px-4 sm:px-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-40 w-96 h-96 bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-accent-sky/8 dark:bg-accent-sky/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-40 left-1/4 w-80 h-80 bg-accent-aqua/8 dark:bg-accent-aqua/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 sm:px-5 py-1.5 sm:py-2 glass-light rounded-full mb-6 sm:mb-8 animate-fade-in">
            <span className="text-xs sm:text-sm text-light-600 dark:text-dark-300">Your wallet, your rules ✨</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-tight mb-4 sm:mb-6 animate-slide-up">
            <span className="text-light-800 dark:text-dark-100">Duit Lo,</span>
            <br />
            <span className="text-gradient">Rules Lo 💰</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-light-600 dark:text-dark-400 max-w-2xl mx-auto mb-8 sm:mb-10 animate-slide-up px-2" style={{ animationDelay: '0.1s' }}>
            FinTrack bikin lo aware sama spending habits. Track pemasukan, pengeluaran, 
            dan capai financial goals lo dengan cara yang fun!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/register"
              className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Mulai Gratis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform sm:w-5 sm:h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 glass-light text-light-700 dark:text-dark-200 font-semibold rounded-xl hover:bg-light-200/50 dark:hover:bg-white/10 transition-all duration-300"
            >
              Sudah Punya Akun
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient">10K+</div>
              <div className="text-xs sm:text-sm text-light-500 dark:text-dark-500">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient">50M+</div>
              <div className="text-xs sm:text-sm text-light-500 dark:text-dark-500">Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient">4.9⭐</div>
              <div className="text-xs sm:text-sm text-light-500 dark:text-dark-500">Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-light-800 dark:text-dark-100 mb-3 sm:mb-4">
              Kenapa <span className="text-gradient">FinTrack</span>?
            </h2>
            <p className="text-sm sm:text-base text-light-600 dark:text-dark-400 max-w-xl mx-auto">
              Built for Gen Z, by Gen Z. Simple, visual, dan bikin lo excited buat manage duit.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Visual Analytics"
              description="Dashboard yang aesthetic dan easy to understand. Lihat kemana duit lo pergi dalam satu pandangan."
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Auto Sync"
              description="Connect sama e-wallet favorit lo - GoPay, OVO, Dana. Semua transaksi ke-track otomatis."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Super Secure"
              description="Data finansial lo aman. Bank-level encryption dan privacy yang lo deserve."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 dark:from-primary-500/10 to-accent-aqua/5 dark:to-accent-aqua/10" />
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-4xl font-bold font-display text-light-800 dark:text-dark-100 mb-3 sm:mb-4">
                Ready to take control?
              </h2>
              <p className="text-sm sm:text-base text-light-600 dark:text-dark-400 mb-6 sm:mb-8 max-w-lg mx-auto">
                Join thousands of Gen Z yang udah level up financial game mereka. Gratis forever!
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
              >
                Start Your Journey
                <Sparkles size={18} className="sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t border-light-200 dark:border-dark-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-bold font-display text-sm sm:text-base">
              <span className="text-gradient">Fin</span>
              <span className="text-light-600 dark:text-dark-300">Track</span>
            </span>
          </div>
          <div className="text-light-500 dark:text-dark-500 text-xs sm:text-sm">
            © 2024 FinTrack. Made with 💙 for Gen Z
          </div>
        </div>
      </footer>
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
    <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 group hover:bg-light-100/50 dark:hover:bg-white/5 transition-all duration-300">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-3 sm:mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-500/30 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-light-600 dark:text-dark-400 leading-relaxed">{description}</p>
    </div>
  )
}
