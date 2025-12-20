'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface CategoryData {
  name: string
  icon?: string
  color?: string
  total: number
}

interface CategoryPieChartProps {
  data: CategoryData[]
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
]

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const total = data.reduce((sum, item) => sum + item.total, 0)

  const chartData = data.map((item, index) => ({
    ...item,
    percentage: total > 0 ? ((item.total / total) * 100).toFixed(1) : '0',
    color: item.color || COLORS[index % COLORS.length],
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="glass rounded-lg p-3 border border-light-200 dark:border-dark-800 shadow-lg">
          <p className="text-sm font-semibold text-light-800 dark:text-dark-100 mb-1">
            {data.name}
          </p>
          <p className="text-xs text-light-600 dark:text-dark-400">
            Amount: {formatCurrency(data.total)}
          </p>
          <p className="text-xs text-light-600 dark:text-dark-400">
            Percentage: {data.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // Don't show label if less than 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] sm:h-[350px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-light-500 dark:text-dark-500 text-sm">
            No expense data available
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="total"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-xs text-light-700 dark:text-dark-300">
                  {value} ({entry.payload.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category List */}
      <div className="mt-4 space-y-2">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 rounded-lg bg-light-100/50 dark:bg-dark-800/50"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-light-700 dark:text-dark-300 truncate">
                {item.name}
              </span>
            </div>
            <div className="text-right ml-2">
              <p className="text-sm font-semibold text-light-800 dark:text-dark-100">
                {formatCurrency(item.total)}
              </p>
              <p className="text-xs text-light-500 dark:text-dark-500">{item.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

