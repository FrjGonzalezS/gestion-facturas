"use client"

import { useEffect, useState } from "react"
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  FileMinus2,
  FileX2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getKpiData } from "@/lib/api"
import type { KpiData } from "@/lib/types"

const kpiConfig = [
  {
    key: "paid" as const,
    label: "Pagadas",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    key: "pending" as const,
    label: "Pendientes",
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    key: "overdue" as const,
    label: "Vencidas",
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    key: "issued" as const,
    label: "Emitidas",
    icon: FileCheck,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "partial" as const,
    label: "Parciales",
    icon: FileMinus2,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    key: "cancelled" as const,
    label: "Canceladas",
    icon: FileX2,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
]

export function KpiCards() {
  const [data, setData] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getKpiData().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={`skeleton-${i}`}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.key}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.bg}`}
              >
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold text-card-foreground">
                  {data[kpi.key]}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
