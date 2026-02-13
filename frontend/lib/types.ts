export type InvoiceStatus = "Issued" | "Partial" | "Cancelled"
export type PaymentStatus = "Paid" | "Pending" | "Overdue"

export interface Product {
  id: string
  name: string
  sku?: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface CreditNote {
  id: string
  invoice_id: string
  amount: number
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  issue_date: string
  payment_due_date: string
  total_amount: number
  credit_applied: number
  balance: number
  invoice_status: InvoiceStatus
  payment_status: PaymentStatus
  is_consistent: boolean
  products: Product[]
  credit_notes: CreditNote[]
  products_sum: number
}

export interface InvoiceFilters {
  search?: string
  invoice_status?: InvoiceStatus | ""
  payment_status?: PaymentStatus | ""
  consistent_only?: boolean
}

export interface KpiData {
  total_active: number
  paid: number
  pending: number
  overdue: number
  issued: number
  partial: number
  cancelled: number
}

export interface ReportOverdue {
  id: string
  invoice_number: string
  client_name: string
  payment_due_date: string
  days_overdue: number
  total_amount: number
  payment_status: PaymentStatus
}

export interface PaymentSummary {
  status: PaymentStatus
  count: number
  total: number
  percentage: number
}
