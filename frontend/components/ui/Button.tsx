'use client'

import { Loader2 } from 'lucide-react'

interface ButtonProps {
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  onClick?: () => void
  className?: string
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  className = '',
}: ButtonProps) {
  const baseStyles = `
    relative inline-flex items-center justify-center
    font-semibold rounded-lg sm:rounded-xl
    transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    focus:ring-offset-white dark:focus:ring-offset-dark-950
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `

  const variants = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600
      text-white
      hover:from-primary-400 hover:to-primary-500
      focus:ring-primary-500
      shadow-lg shadow-primary-500/25
      hover:shadow-xl hover:shadow-primary-500/30
    `,
    secondary: `
      bg-light-200 dark:bg-dark-800
      text-light-800 dark:text-dark-100
      border border-light-300 dark:border-dark-700
      hover:bg-light-300 dark:hover:bg-dark-700 
      hover:border-light-400 dark:hover:border-dark-600
      focus:ring-light-400 dark:focus:ring-dark-500
    `,
    ghost: `
      bg-transparent
      text-light-600 dark:text-dark-300
      hover:text-light-800 dark:hover:text-dark-100 
      hover:bg-light-100 dark:hover:bg-dark-800/50
      focus:ring-light-400 dark:focus:ring-dark-500
    `,
  }

  const sizes = {
    sm: 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm',
    md: 'px-4 sm:px-6 py-2.5 sm:py-3.5 text-sm sm:text-base',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading && (
        <Loader2 className="absolute left-1/2 -translate-x-1/2 animate-spin w-4 h-4 sm:w-5 sm:h-5" />
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  )
}
