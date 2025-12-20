'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MonthlyData {
  month: number
  year: number
  income: number
  expense: number
}

interface MonthlyIncomeChartProps {
  data: MonthlyData[]
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function MonthlyIncomeChart({ data }: MonthlyIncomeChartProps) {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set(data.map((item) => item.year))
    return Array.from(years).sort((a, b) => b - a) // Sort descending
  }, [data])

  // Filter and prepare chart data
  const chartData = useMemo(() => {
    let filteredData = data

    // Filter by year if selected
    if (selectedYear !== 'all') {
      filteredData = data.filter((item) => item.year === selectedYear)
    }

    // Get last 12 months if "all" is selected
    if (selectedYear === 'all') {
      filteredData = filteredData.slice(-12)
    }

    // Ensure we have 12 months of data
    const result = filteredData
      .map((item) => ({
        ...item,
        monthName: `${monthNames[item.month - 1]} ${item.year}`,
        shortMonthName: monthNames[item.month - 1],
      }))
      .sort((a, b) => {
        // Sort by year first, then by month
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })

    return result
  }, [data, selectedYear])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-light-200 dark:border-dark-800 shadow-lg">
          <p className="text-sm font-semibold text-light-800 dark:text-dark-100 mb-2">
            {payload[0].payload.monthName}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs flex items-center gap-2" style={{ color: entry.color }}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name === 'income' ? 'Income' : 'Expense'}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {/* Filter */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-light-600 dark:text-dark-400">Filter by year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg text-light-900 dark:text-dark-50 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
          >
            <option value="all">Last 12 Months</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
            <XAxis
              dataKey={selectedYear === 'all' ? 'monthName' : 'shortMonthName'}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-light-600 dark:text-dark-400"
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-light-600 dark:text-dark-400"
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                return value.toString()
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (value === 'income' ? 'Income' : 'Expense')}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="income"
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
              name="expense"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

