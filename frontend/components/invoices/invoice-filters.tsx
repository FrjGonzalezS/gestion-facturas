"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { InvoiceFilters as Filters } from "@/lib/types"

interface InvoiceFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function InvoiceFilters({ filters, onFiltersChange }: InvoiceFiltersProps) {
  const handleClear = () => {
    onFiltersChange({
      search: "",
      invoice_status: "",
      payment_status: "",
      consistent_only: true,
    })
  }

  const hasFilters =
    filters.search ||
    filters.invoice_status ||
    filters.payment_status ||
    filters.consistent_only === false

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por N° factura o cliente..."
          value={filters.search || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9"
          aria-label="Buscar factura"
        />
      </div>
      <Select
        value={filters.invoice_status || "all"}
        onValueChange={(val) =>
          onFiltersChange({
            ...filters,
            invoice_status: val === "all" ? "" : (val as Filters["invoice_status"]),
          })
        }
      >
        <SelectTrigger className="w-full md:w-[160px]" aria-label="Estado factura">
          <SelectValue placeholder="Estado factura" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="Issued">Emitida</SelectItem>
          <SelectItem value="Partial">Parcial</SelectItem>
          <SelectItem value="Cancelled">Cancelada</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.payment_status || "all"}
        onValueChange={(val) =>
          onFiltersChange({
            ...filters,
            payment_status: val === "all" ? "" : (val as Filters["payment_status"]),
          })
        }
      >
        <SelectTrigger className="w-full md:w-[160px]" aria-label="Estado pago">
          <SelectValue placeholder="Estado pago" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="Paid">Pagado</SelectItem>
          <SelectItem value="Pending">Pendiente</SelectItem>
          <SelectItem value="Overdue">Vencido</SelectItem>
        </SelectContent>
      </Select>
      {/* Eliminado switch de solo consistentes */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0">
          <X className="mr-1 h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
