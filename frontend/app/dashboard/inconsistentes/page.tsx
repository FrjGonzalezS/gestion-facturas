"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getInconsistentInvoices } from "@/lib/api"
import { formatCLP, formatDate } from "@/lib/format"
import type { Invoice } from "@/lib/types"

export default function InconsistentesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInconsistentInvoices().then((data) => {
      setInvoices(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Facturas Inconsistentes
        </h2>
        <p className="text-sm text-muted-foreground">
          Facturas donde el total declarado no coincide con la suma de
          productos.
        </p>
      </div>

      <Alert
        variant="destructive"
        className="border-warning/30 bg-warning/5 text-foreground"
      >
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertTitle className="text-foreground">
          ¿Qué es una factura inconsistente?
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Una factura se considera inconsistente cuando el monto total declarado
          en la factura no coincide con la suma de los subtotales de sus
          productos. Esto puede deberse a errores de digitación, redondeo, o
          datos incompletos. Estas facturas son excluidas por defecto de los
          reportes y del listado principal.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Facturas con discrepancia ({loading ? "..." : invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48" />
          ) : invoices.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No se encontraron facturas inconsistentes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>N° Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">
                      Total declarado
                    </TableHead>
                    <TableHead className="text-right">
                      Suma productos
                    </TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const diff = inv.total_amount - inv.products_sum
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell>{inv.client_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(inv.issue_date)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCLP(inv.total_amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCLP(inv.products_sum)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold text-destructive">
                          {diff > 0 ? "+" : ""}
                          {formatCLP(diff)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
