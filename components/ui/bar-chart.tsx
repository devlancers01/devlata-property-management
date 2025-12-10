"use client"

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface BarChartProps {
  data: any[]
  index: string
  categories: string[]
  valueFormatter?: (value: number) => string
  colors?: string[]
  yAxisWidth?: number
}

export function BarChart({ data, index, categories, valueFormatter, colors = ['#3b82f6', '#ef4444'], yAxisWidth = 80 }: BarChartProps) {
  const COLORS = colors.map(color => {
    const colorMap: Record<string, string> = {
      blue: '#3b82f6',
      red: '#ef4444',
      green: '#22c55e',
      emerald: '#10b981',
      purple: '#a855f7',
    }
    return colorMap[color] || color
  })

  const formatter = valueFormatter || ((value: number) => value.toString())

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey={index} 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis 
          width={yAxisWidth}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          tickFormatter={formatter}
        />
        <Tooltip
          formatter={(value: number) => formatter(value)}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend />
        {categories.map((category, index) => (
          <Bar 
            key={category}
            dataKey={category} 
            fill={COLORS[index % COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}