"use client"

import { useEffect, useState, useCallback, use } from "react"
import Link from "next/link"
import { ArrowLeft, PlusCircle, Package, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  InvoiceStatusBadge,
  PaymentStatusBadge,
} from "@/components/invoices/status-badge"
import { CreditNoteModal } from "@/components/invoices/credit-note-modal"
import { getInvoiceByNumber } from "@/lib/api"
import { formatCLP, formatDate } from "@/lib/format"
import type { Invoice } from "@/lib/types"


import { useParams } from "next/navigation"

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>()
  const invoice_number = params?.id
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [cnModalOpen, setCnModalOpen] = useState(false)

  const fetchInvoice = useCallback(async () => {
    setLoading(true)
    const data = await getInvoiceByNumber(invoice_number)
    setInvoice(data)
    setLoading(false)
  }, [invoice_number])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-lg text-muted-foreground">Factura no encontrada</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Facturas
          </Link>
        </Button>
      </div>
    )
  }

  const pendingBalance =
    invoice.total_amount -
    invoice.credit_notes.reduce((sum, cn) => sum + cn.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {invoice.invoice_number}
          </h2>
          <p className="text-sm text-muted-foreground">{invoice.client_name}</p>
        </div>
      </div>

      {/* Main Invoice Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">N° Factura</span>
              <span className="font-mono font-semibold">
                {invoice.invoice_number}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Cliente</span>
              <span className="font-semibold">{invoice.client_name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Fecha de emisión
              </span>
              <span>{formatDate(invoice.issue_date)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Fecha de vencimiento
              </span>
              <span>{formatDate(invoice.payment_due_date)}</span>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Total factura
              </span>
              <span className="text-xl font-bold font-mono">
                {formatCLP(invoice.total_amount)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Saldo pendiente
              </span>
              <span
                className={`text-xl font-bold font-mono ${
                  pendingBalance > 0
                    ? "text-destructive"
                    : "text-success"
                }`}
              >
                {formatCLP(pendingBalance)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <InvoiceStatusBadge status={invoice.invoice_status} />
              <PaymentStatusBadge status={invoice.payment_status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-primary" />
            Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {product.sku || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCLP(product.unit_price)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {formatCLP(product.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Credit Notes Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Notas de Crédito
            </CardTitle>
            <Button
              size="sm"
              disabled={invoice.invoice_status === "Cancelled"}
              onClick={() => setCnModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar NC
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoice.credit_notes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay notas de crédito asociadas a esta factura.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.credit_notes.map((cn) => (
                    <TableRow key={cn.id}>
                      <TableCell className="font-mono text-sm">
                        {cn.id}
                      </TableCell>
                      <TableCell>{formatDate(cn.created_at)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCLP(cn.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {invoice.invoice_status === "Cancelled" && (
            <p className="mt-3 text-xs text-muted-foreground">
              No se pueden agregar notas de crédito a una factura cancelada.
            </p>
          )}
        </CardContent>
      </Card>

      <CreditNoteModal
        invoice={invoice}
        open={cnModalOpen}
        onOpenChange={setCnModalOpen}
        onSuccess={() => {
          setCnModalOpen(false)
          fetchInvoice()
        }}
      />
    </div>
  )
}
