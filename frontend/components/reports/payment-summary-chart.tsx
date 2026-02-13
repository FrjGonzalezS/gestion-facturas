"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { formatCLP } from "@/lib/format"
import type { PaymentSummary } from "@/lib/types"

const COLORS: Record<string, string> = {
  Paid: "hsl(152, 60%, 42%)",
  Pending: "hsl(38, 92%, 50%)",
  Overdue: "hsl(0, 72%, 51%)",
}

const LABELS: Record<string, string> = {
  Paid: "Pagadas",
  Pending: "Pendientes",
  Overdue: "Vencidas",
}

interface PaymentSummaryChartProps {
  data: PaymentSummary[]
}

export function PaymentSummaryChart({ data }: PaymentSummaryChartProps) {
  const chartData = data.map((d) => ({
    name: LABELS[d.status],
    value: d.count,
    total: d.total,
    status: d.status,
  }))

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.status}
                fill={COLORS[entry.status]}
                strokeWidth={0}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(
              value: number,
              name: string,
              entry: any,
            ) => [
              `${value} facturas (${formatCLP(entry?.payload?.total ?? 0)})`,
              name,
            ]}
            contentStyle={{
              backgroundColor: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(214, 15%, 90%)",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
