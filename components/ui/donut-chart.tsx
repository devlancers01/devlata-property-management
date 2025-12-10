"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DonutChartProps {
  data: Array<{ name: string; value: number }>
  category: string
  index: string
  className?: string
  showAnimation?: boolean
  showLabel?: boolean
  valueFormatter?: (value: number) => string
  colors?: string[]
}

const DEFAULT_COLORS = ['#3b82f6', '#06b6d4', '#6366f1', '#8b5cf6', '#a855f7']

export function DonutChart({ data, valueFormatter, colors = DEFAULT_COLORS }: DonutChartProps) {
  const COLORS = colors.map(color => {
    const colorMap: Record<string, string> = {
      blue: '#3b82f6',
      cyan: '#06b6d4',
      indigo: '#6366f1',
      violet: '#8b5cf6',
      purple: '#a855f7',
      rose: '#f43f5e',
      red: '#ef4444',
      orange: '#f97316',
      amber: '#f59e0b',
      yellow: '#eab308',
      emerald: '#10b981',
      teal: '#14b8a6',
      green: '#22c55e',
    }
    return colorMap[color] || color
  })

  const formatter = valueFormatter || ((value: number) => value.toString())

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatter(value)}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => <span className="text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}