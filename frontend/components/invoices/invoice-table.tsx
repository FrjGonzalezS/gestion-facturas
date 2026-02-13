"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpDown, Eye, PlusCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { InvoiceStatusBadge, PaymentStatusBadge } from "./status-badge"
import { CreditNoteModal } from "./credit-note-modal"
import { formatCLP, formatDate } from "@/lib/format"
import type { Invoice } from "@/lib/types"

interface InvoiceTableProps {
  invoices: Invoice[]
  loading: boolean
  error?: string | null
  onCreditNoteAdded?: () => void
}

type SortField = "issue_date" | "total_amount"
type SortDir = "asc" | "desc"

const ITEMS_PER_PAGE = 8

export function InvoiceTable({
  invoices,
  loading,
  error,
  onCreditNoteAdded,
}: InvoiceTableProps) {
  const [sortField, setSortField] = useState<SortField>("issue_date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(0)
  const [cnModalInvoice, setCnModalInvoice] = useState<Invoice | null>(null)

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
    setPage(0)
  }

  const sorted = [...invoices].sort((a, b) => {
    const multiplier = sortDir === "asc" ? 1 : -1
    if (sortField === "issue_date") {
      return (
        multiplier *
        (new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime())
      )
    }
    return multiplier * (a.total_amount - b.total_amount)
  })

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE)
  const paginated = sorted.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  )

  if (loading) {
    return (
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableHead key={`h-${i}`}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`r-${i}`}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <TableCell key={`c-${i}-${j}`}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          No se encontraron facturas con los filtros seleccionados.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="whitespace-nowrap">N° Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 px-2 text-xs font-medium"
                  onClick={() => toggleSort("issue_date")}
                >
                  Emisión
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="whitespace-nowrap">Vence</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2 h-8 px-2 text-xs font-medium"
                  onClick={() => toggleSort("total_amount")}
                >
                  Total
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="whitespace-nowrap text-right">
                Crédito
              </TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-sm font-medium">
                  {inv.invoice_number}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {inv.client_name}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(inv.issue_date)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(inv.payment_due_date)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-mono text-sm">
                  {formatCLP(inv.total_amount)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-mono text-sm text-muted-foreground">
                  {formatCLP(inv.credit_applied)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-mono text-sm font-medium">
                  {formatCLP(inv.balance)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={inv.invoice_status} />
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={inv.payment_status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/invoices/${inv.invoice_number}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        <span className="sr-only md:not-sr-only">Ver</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={inv.invoice_status === "Cancelled"}
                      onClick={() => setCnModalInvoice(inv)}
                    >
                      <PlusCircle className="mr-1 h-4 w-4" />
                      <span className="sr-only md:not-sr-only">NC</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {page * ITEMS_PER_PAGE + 1}-
            {Math.min((page + 1) * ITEMS_PER_PAGE, sorted.length)} de{" "}
            {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <CreditNoteModal
        invoice={cnModalInvoice}
        open={!!cnModalInvoice}
        onOpenChange={(open) => {
          if (!open) setCnModalInvoice(null)
        }}
        onSuccess={() => {
          setCnModalInvoice(null)
          onCreditNoteAdded?.()
        }}
      />
    </>
  )
}
