'use client'

import { Pie, PieChart } from 'recharts'

import { ChartConfig, ChartContainer } from '@/components/ui/chart'

const chartConfig = {
  solved: {
    label: 'Chrome',
    color: 'rgb(190, 20, 20)',
  },
  notSolved: {
    label: 'Other',
    color: 'rgb(205, 24, 24, 0.2)',
  },
} satisfies ChartConfig

export default function CountChart({
  totalSolved,
  total,
}: {
  totalSolved: number
  total: number
}) {
  const chartData = [
    { type: 'solved', people: totalSolved, fill: 'var(--color-solved)' },
    { type: 'noSolved', people: total - totalSolved, fill: 'var(--color-notSolved)' },
  ]

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square max-h-[43px] w-[43px]"
    >
      <PieChart>
        <Pie
          data={chartData}
          dataKey="people"
          nameKey="type"
          innerRadius={9}
          strokeWidth={2}
        ></Pie>
      </PieChart>
    </ChartContainer>
  )
}
