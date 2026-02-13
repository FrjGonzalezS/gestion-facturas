import { Badge } from "@/components/ui/badge"
import type { InvoiceStatus, PaymentStatus } from "@/lib/types"

const invoiceStatusStyles: Record<InvoiceStatus, string> = {
  Issued: "bg-primary/15 text-primary border-primary/20",
  Partial: "bg-warning/15 text-warning border-warning/20",
  Cancelled: "bg-muted text-muted-foreground border-muted",
}

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  Issued: "Emitida",
  Partial: "Parcial",
  Cancelled: "Cancelada",
}

const paymentStatusStyles: Record<PaymentStatus, string> = {
  Paid: "bg-success/15 text-success border-success/20",
  Pending: "bg-warning/15 text-warning border-warning/20",
  Overdue: "bg-destructive/15 text-destructive border-destructive/20",
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  Paid: "Pagado",
  Pending: "Pendiente",
  Overdue: "Vencido",
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant="outline" className={invoiceStatusStyles[status]}>
      {invoiceStatusLabels[status]}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={paymentStatusStyles[status]}>
      {paymentStatusLabels[status]}
    </Badge>
  )
}
