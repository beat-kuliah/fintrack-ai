'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps {
  label?: string
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  icon?: React.ReactNode
  name?: string
  required?: boolean
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon,
  name,
  required = false,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-light-700 dark:text-dark-300 mb-1.5 sm:mb-2">
          {label}
          {required && <span className="text-primary-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className={`
            w-full px-3 sm:px-4 py-2.5 sm:py-3.5 
            text-sm sm:text-base
            ${icon ? 'pl-10 sm:pl-12' : 'pl-3 sm:pl-4'}
            ${type === 'password' ? 'pr-10 sm:pr-12' : 'pr-3 sm:pr-4'}
            bg-light-100 dark:bg-dark-800/50 
            border border-light-300 dark:border-dark-700
            rounded-lg sm:rounded-xl
            text-light-900 dark:text-dark-50
            placeholder:text-light-500 dark:placeholder:text-dark-500
            transition-all duration-300
            focus:outline-none
            focus:border-primary-400 dark:focus:border-primary-500/50
            focus:ring-2 focus:ring-primary-500/20
            focus:bg-white dark:focus:bg-dark-800
            hover:border-light-400 dark:hover:border-dark-600
            ${error ? 'border-red-400 dark:border-red-500/50 focus:border-red-400 dark:focus:border-red-500/50 focus:ring-red-500/20' : ''}
            ${isFocused ? 'shadow-lg shadow-primary-500/10 dark:shadow-primary-500/5' : ''}
          `}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 hover:text-light-700 dark:hover:text-dark-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-500 dark:text-red-400 animate-slide-down">{error}</p>
      )}
    </div>
  )
}
