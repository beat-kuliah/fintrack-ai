'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Settings ⚙️
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Account Settings */}
          <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-4">
              Account Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-light-200 dark:border-dark-800">
                <div>
                  <p className="text-sm font-medium text-light-800 dark:text-dark-100">Profile Information</p>
                  <p className="text-xs text-light-500 dark:text-dark-500">Update your name and email</p>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  Edit →
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-light-200 dark:border-dark-800">
                <div>
                  <p className="text-sm font-medium text-light-800 dark:text-dark-100">Password</p>
                  <p className="text-xs text-light-500 dark:text-dark-500">Change your password</p>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  Change →
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-light-800 dark:text-dark-100">Notifications</p>
                  <p className="text-xs text-light-500 dark:text-dark-500">Manage notification preferences</p>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  Configure →
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-4">
              Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-light-200 dark:border-dark-800">
                <div>
                  <p className="text-sm font-medium text-light-800 dark:text-dark-100">Currency</p>
                  <p className="text-xs text-light-500 dark:text-dark-500">Set your default currency</p>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  IDR →
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-light-800 dark:text-dark-100">Date Format</p>
                  <p className="text-xs text-light-500 dark:text-dark-500">Choose your preferred date format</p>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  DD/MM/YYYY →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

