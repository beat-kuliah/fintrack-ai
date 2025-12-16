'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300
        bg-light-200 dark:bg-dark-800 
        hover:bg-light-300 dark:hover:bg-dark-700
        border border-light-300 dark:border-dark-700
        text-light-700 dark:text-dark-300
        hover:text-primary-600 dark:hover:text-primary-400
        focus:outline-none focus:ring-2 focus:ring-primary-500/30"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-4 h-4 sm:w-5 sm:h-5">
        <Sun
          className={`absolute inset-0 transform transition-all duration-300 w-4 h-4 sm:w-5 sm:h-5 ${
            theme === 'dark' 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 transform transition-all duration-300 w-4 h-4 sm:w-5 sm:h-5 ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  )
}
