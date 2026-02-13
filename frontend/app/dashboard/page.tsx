"use client"

import { KpiCards } from "@/components/invoices/kpi-cards"
import { InvoiceFilters } from "@/components/invoices/invoice-filters"
import { InvoiceTable } from "@/components/invoices/invoice-table"
import { useEffect, useState, useCallback } from "react"
import { getInvoices } from "@/lib/api"
import type { Invoice, InvoiceFilters as Filters } from "@/lib/types"

export default function DashboardHomePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    invoice_status: "",
    payment_status: "",
    consistent_only: true,
  })

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getInvoices(filters)
      setInvoices(data)
    } catch {
      setError("Error al cargar las facturas")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Facturas
        </h2>
        <p className="text-sm text-muted-foreground">
          Administra y revisa todas las facturas del sistema.
        </p>
      </div>

      <KpiCards />

      <div className="rounded-lg border bg-card p-4">
        <InvoiceFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      <InvoiceTable
        invoices={invoices}
        loading={loading}
        error={error}
        onCreditNoteAdded={fetchInvoices}
      />
    </div>
  )
}