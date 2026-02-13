"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaymentStatusBadge } from "@/components/invoices/status-badge"
import { PaymentSummaryChart } from "@/components/reports/payment-summary-chart"
import { getOverdueReport, getPaymentSummary } from "@/lib/api"
import { formatCLP, formatDate } from "@/lib/format"
import type { ReportOverdue, PaymentSummary } from "@/lib/types"

export default function ReportsPage() {
  const [overdue, setOverdue] = useState<ReportOverdue[]>([])
  const [summary, setSummary] = useState<PaymentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getOverdueReport(), getPaymentSummary()]).then(
      ([overdueData, summaryData]) => {
        setOverdue(overdueData)
        setSummary(summaryData)
        setLoading(false)
      }
    )
  }, [])

  const handleExport = () => {
    toast.info("Funcionalidad de exportación CSV próximamente disponible")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Reportes
          </h2>
          <p className="text-sm text-muted-foreground">
            Análisis y resúmenes de facturación.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Section B: Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Resumen por Estado de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`sum-${i}`} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-3">
                {summary.map((s) => {
                  const colorMap: Record<string, string> = {
                    Paid: "bg-success/10 border-success/20",
                    Pending: "bg-warning/10 border-warning/20",
                    Overdue: "bg-destructive/10 border-destructive/20",
                  }
                  const textMap: Record<string, string> = {
                    Paid: "text-success",
                    Pending: "text-warning",
                    Overdue: "text-destructive",
                  }
                  const labelMap: Record<string, string> = {
                    Paid: "Pagadas",
                    Pending: "Pendientes",
                    Overdue: "Vencidas",
                  }
                  return (
                    <div
                      key={s.status}
                      className={`rounded-lg border p-4 ${colorMap[s.status]}`}
                    >
                      <p className="text-sm font-medium text-muted-foreground">
                        {labelMap[s.status]}
                      </p>
                      <p className={`text-2xl font-bold ${textMap[s.status]}`}>
                        {s.count}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCLP(s.total)} ({s.percentage}%)
                      </p>
                    </div>
                  )
                })}
              </div>
              <PaymentSummaryChart data={summary} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section A: Overdue > 30 days */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Facturas consistentes {'>'} 30 días vencidas sin pago ni NC
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48" />
          ) : overdue.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay facturas que cumplan este criterio.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>N° Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Días vencida</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {item.invoice_number}
                      </TableCell>
                      <TableCell>{item.client_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.payment_due_date)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-destructive">
                        {item.days_overdue}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCLP(item.total_amount)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={item.payment_status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
