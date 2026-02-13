// Obtiene una factura por invoice_number usando el nuevo endpoint backend
export async function getInvoiceByNumber(invoiceNumber: string | number): Promise<Invoice | null> {
  const num = typeof invoiceNumber === "string" ? parseInt(invoiceNumber, 10) : invoiceNumber;
  if (!BASE) {
    await delay(200)
    return mockInvoices.find((inv) => Number(inv.invoice_number) === num) ?? null
  }
  const res = await fetch(`${BASE}/api/invoices/by-number/${num}`)
  if (!res.ok) return null
  const dto = await res.json()
  return mapDetailDtoToInvoice(dto)
}
import { mockInvoices } from "./mock-data"
import type {
  Invoice,
  InvoiceFilters,
  KpiData,
  CreditNote,
  ReportOverdue,
  PaymentSummary,
} from "./types"

const BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "")

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toDateString(d: string | Date) {
  const dt = new Date(d)
  return dt.toISOString().split("T")[0]
}

async function fetchJsonInvoicesFromBackend(): Promise<any[] | null> {
  if (!BASE) return null

  // Try default filename first
  const tryFetch = async (name: string) => {
    try {
      const r = await fetch(`${BASE}/api/json-files/${encodeURIComponent(name)}`)
      if (!r.ok) return null
      const j = await r.json()
      // DTO shape: { invoices: [...] } or array directly
      return Array.isArray(j) ? j : j.invoices ?? null
    } catch {
      return null
    }
  }

  const defaultName = "bd_exam_invoices.json"
  let invoices = await tryFetch(defaultName)
  if (invoices) return invoices

  // If default not present, list files and pick first .json
  try {
    const listRes = await fetch(`${BASE}/api/json-files/`)
    if (!listRes.ok) return null
    const files: string[] = await listRes.json()
    const jsonFile = files.find((f) => f.toLowerCase().endsWith(".json"))
    if (!jsonFile) return null
    invoices = await tryFetch(jsonFile)
    return invoices
  } catch {
    return null
  }
}

async function getPendingFromJson(): Promise<{ count: number; total: number } | null> {
  const invoices = await fetchJsonInvoicesFromBackend()
  if (!invoices) return null
  let count = 0
  let total = 0
  invoices.forEach((inv: any) => {
    const ps = (inv.payment_status || inv.paymentStatus || "").toString().toLowerCase()
    if (ps === "pending") {
      count++
      total += Number(inv.total_amount ?? inv.totalAmount ?? 0)
    }
  })
  return { count, total }
}

function mapListDtoToInvoice(dto: any): Invoice {
  const parseInvoiceStatus = (v: any) => {
    if (typeof v === "number") {
      // backend enums: 0=Issued,1=Partial,2=Cancelled
      return v === 1 ? "Partial" : v === 2 ? "Cancelled" : "Issued"
    }
    const s = String(v || "").toLowerCase()
    if (s === "partial") return "Partial"
    if (s === "cancelled" || s === "canceled") return "Cancelled"
    return "Issued"
  }

  const parsePaymentStatus = (v: any) => {
    if (typeof v === "number") {
      // backend enums: 0=Pending,1=Paid,2=Overdue
      return v === 1 ? "Paid" : v === 2 ? "Overdue" : "Pending"
    }
    const s = String(v || "").toLowerCase()
    if (s === "paid") return "Paid"
    if (s === "overdue") return "Overdue"
    return "Pending"
  }
  return {
    id: dto.id,
    invoice_number: String(dto.invoiceNumber),
    client_name: dto.customerName,
    issue_date: toDateString(dto.invoiceDate),
    payment_due_date: toDateString(dto.paymentDueDate),
    total_amount: Number(dto.totalAmount),
    credit_applied: Number(dto.creditApplied ?? 0),
    balance: Number(dto.balance ?? 0),
    invoice_status: parseInvoiceStatus(dto.invoiceStatus) as any,
    payment_status: parsePaymentStatus(dto.paymentStatus) as any,
    is_consistent: true,
    products: [],
    credit_notes: [],
    products_sum: 0,
  }
}

function mapDetailDtoToInvoice(dto: any): Invoice {
  const parseInvoiceStatus = (v: any) => {
    if (typeof v === "number") {
      return v === 1 ? "Partial" : v === 2 ? "Cancelled" : "Issued"
    }
    const s = String(v || "").toLowerCase()
    if (s === "partial") return "Partial"
    if (s === "cancelled" || s === "canceled") return "Cancelled"
    return "Issued"
  }

  const parsePaymentStatus = (v: any) => {
    if (typeof v === "number") {
      return v === 1 ? "Paid" : v === 2 ? "Overdue" : "Pending"
    }
    const s = String(v || "").toLowerCase()
    if (s === "paid") return "Paid"
    if (s === "overdue") return "Overdue"
    return "Pending"
  }
  return {
    id: dto.id,
    invoice_number: String(dto.invoiceNumber),
    client_name: dto.customerName,
    issue_date: toDateString(dto.invoiceDate),
    payment_due_date: toDateString(dto.paymentDueDate),
    total_amount: Number(dto.totalAmount),
    credit_applied: Number(dto.creditApplied ?? dto.credit_applied ?? 0),
    balance: Number(dto.balance ?? 0),
    invoice_status: parseInvoiceStatus(dto.invoiceStatus),
    payment_status: parsePaymentStatus(dto.paymentStatus),
    is_consistent: dto.isConsistent !== undefined ? Boolean(dto.isConsistent) : true,
    products: (dto.items || dto.products || []).map((it: any) => ({
      id: it.id,
      name: it.productName || it.name,
      sku: it.sku ?? undefined,
      quantity: it.quantity,
      unit_price: Number(it.unitPrice ?? it.unit_price),
      subtotal: Number(it.subtotal ?? (it.quantity && (it.unitPrice ?? it.unit_price) ? it.quantity * (it.unitPrice ?? it.unit_price) : 0)),
    })),
    credit_notes: (dto.creditNotes || dto.credit_notes || []).map((cn: any) => ({
      id: cn.id,
      invoice_id: dto.id,
      amount: Number(cn.amount),
      created_at: toDateString(cn.creditNoteDate ?? cn.created_at ?? new Date()),
    })),
    products_sum: ((dto.items || dto.products || []).reduce((sum: number, it: any) => sum + Number(it.subtotal ?? (it.quantity && (it.unitPrice ?? it.unit_price) ? it.quantity * (it.unitPrice ?? it.unit_price) : 0)), 0)),
  }
}

export async function getInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
  if (!BASE) {
    await delay(300)
    let result = [...mockInvoices]

    if (filters?.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(q) ||
          inv.client_name.toLowerCase().includes(q)
      )
    }

    if (filters?.invoice_status) {
      result = result.filter((inv) => inv.invoice_status === filters.invoice_status)
    }

    if (filters?.payment_status) {
      result = result.filter((inv) => inv.payment_status === filters.payment_status)
    }

    if (filters?.consistent_only !== false) {
      result = result.filter((inv) => inv.is_consistent)
    }

    return result
  }

  // If backend configured, fetch from API
  const qs = new URLSearchParams()
  qs.set("page", "1")
  qs.set("pageSize", "1000")
  if (filters) {
    if (filters.search) qs.set("search", filters.search)
    if (filters.invoice_status) qs.set("invoiceStatus", String(filters.invoice_status))
    if (filters.payment_status) qs.set("paymentStatus", String(filters.payment_status))
    if (typeof filters.consistent_only !== "undefined") qs.set("consistentOnly", String(filters.consistent_only))
  }

  const res = await fetch(`${BASE}/api/invoices?${qs.toString()}`)
  if (!res.ok) throw new Error("Error fetching invoices from backend")
  const json = await res.json()
  const items = json.items || []
  return items.map(mapListDtoToInvoice)
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!BASE) {
    await delay(200)
    return mockInvoices.find((inv) => inv.id === id) ?? null
  }

  const res = await fetch(`${BASE}/api/invoices/${id}`)
  if (!res.ok) return null
  const dto = await res.json()
  return mapDetailDtoToInvoice(dto)
}

export async function createCreditNote(
  invoiceId: string,
  amount: number
): Promise<CreditNote> {
  if (!BASE) {
    await delay(400)
    const invoice = mockInvoices.find((inv) => inv.id === invoiceId)
    if (!invoice) throw new Error("Factura no encontrada")
    if (invoice.invoice_status === "Cancelled")
      throw new Error("No se puede agregar NC a una factura cancelada")
    if (amount > invoice.balance) throw new Error("El monto excede el saldo pendiente")

    const newCN: CreditNote = {
      id: `cn-${Date.now()}`,
      invoice_id: invoiceId,
      amount,
      created_at: new Date().toISOString().split("T")[0],
    }

    invoice.credit_notes.push(newCN)
    invoice.credit_applied += amount
    invoice.balance -= amount

    return newCN
  }

  const res = await fetch(`${BASE}/api/invoices/${invoiceId}/credit-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || "Error creating credit note")
  }
  const dto = await res.json()
  // map detail dto to invoice and extract created credit note (approx)
  const created = dto.creditNotes?.slice(-1)[0]
  return {
    id: created?.id ?? `cn-${Date.now()}`,
    invoice_id: invoiceId,
    amount: Number(created?.amount ?? amount),
    created_at: new Date().toISOString().split("T")[0],
  }
}

export async function getKpiData(): Promise<KpiData> {
  if (!BASE) {
    await delay(200)
    const invoices = mockInvoices.filter((i) => i.is_consistent)
    return {
      total_active: invoices.filter((i) => i.invoice_status !== "Cancelled").length,
      paid: invoices.filter((i) => i.payment_status === "Paid").length,
      pending: invoices.filter((i) => i.payment_status === "Pending").length,
      overdue: invoices.filter((i) => i.payment_status === "Overdue").length,
      issued: invoices.filter((i) => i.invoice_status === "Issued").length,
      partial: invoices.filter((i) => i.invoice_status === "Partial").length,
      cancelled: invoices.filter((i) => i.invoice_status === "Cancelled").length,
    }
  }

  // Backend does not expose a single KPI endpoint in this version; compute from invoices
  // Normalize status strings (case-insensitive) and accept spelling variants
  const invoices = await getInvoices()
  const norm = (s?: string) => (s || "").toString().toLowerCase()
  const isCancelled = (s?: string) => {
    const v = norm(s)
    return v === "cancelled" || v === "canceled"
  }
  const baseResult = {
    total_active: invoices.filter((i) => !isCancelled(i.invoice_status)).length,
    paid: invoices.filter((i) => norm(i.payment_status) === "paid").length,
    pending: invoices.filter((i) => norm(i.payment_status) === "pending").length,
    overdue: invoices.filter((i) => norm(i.payment_status) === "overdue").length,
    issued: invoices.filter((i) => norm(i.invoice_status) === "issued").length,
    partial: invoices.filter((i) => norm(i.invoice_status) === "partial").length,
    cancelled: invoices.filter((i) => isCancelled(i.invoice_status)).length,
  }

  // Try to override pending using the uploaded JSON (informational only)
  try {
    const jsonPending = await getPendingFromJson()
    if (jsonPending) {
      return { ...baseResult, pending: jsonPending.count }
    }
  } catch {
    // ignore
  }

  return baseResult
}

export async function getOverdueReport(): Promise<ReportOverdue[]> {
  if (!BASE) {
    await delay(300)
    const today = new Date()
    return mockInvoices
      .filter((inv) => {
        if (!inv.is_consistent) return false
        const dueDate = new Date(inv.payment_due_date)
        const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff > 30 && inv.payment_status !== "Paid" && inv.credit_notes.length === 0
      })
      .map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: inv.client_name,
        payment_due_date: inv.payment_due_date,
        days_overdue: Math.floor((new Date().getTime() - new Date(inv.payment_due_date).getTime()) / (1000 * 60 * 60 * 24)),
        total_amount: inv.total_amount,
        payment_status: inv.payment_status,
      }))
  }

  // Backend has report endpoints; call them if present
  try {
    // backend endpoint name is verbose; call the implemented route and map fields
    const res = await fetch(`${BASE}/api/reports/overdue-30d-without-payment-without-cn`)
    if (!res.ok) throw new Error("No report endpoint")
    const dto = await res.json()
    return (dto || []).map((d: any) => ({
      id: d.id,
      invoice_number: String(d.invoiceNumber ?? d.InvoiceNumber ?? d.invoice_number ?? ""),
      client_name: d.customerName ?? d.customer_name ?? "",
      payment_due_date: d.paymentDueDate ? new Date(d.paymentDueDate).toISOString().split("T")[0] : (d.payment_due_date ?? ""),
      days_overdue: Number(d.daysOverdue ?? d.DaysOverdue ?? d.days_overdue ?? 0),
      total_amount: Number(d.totalAmount ?? d.TotalAmount ?? d.total_amount ?? 0),
      // These overdue items by definition have no payment -> mark as Overdue
      payment_status: "Overdue",
    }))
  } catch {
    return []
  }
}

export async function getPaymentSummary(): Promise<PaymentSummary[]> {
  if (!BASE) {
    await delay(200)
    const invoices = mockInvoices.filter((i) => i.is_consistent)
    const total = invoices.length
    const statuses = ["Paid", "Pending", "Overdue"] as const
    return statuses.map((status) => {
      const filtered = invoices.filter((i) => i.payment_status === status)
      const sum = filtered.reduce((acc, i) => acc + i.total_amount, 0)
      return {
        status,
        count: filtered.length,
        total: sum,
        percentage: total > 0 ? Math.round((filtered.length / total) * 100) : 0,
      }
    })
  }

  try {
    // backend endpoint uses payment-status-summary
    const res = await fetch(`${BASE}/api/reports/payment-status-summary`)
    if (!res.ok) throw new Error("No report endpoint")
    const dto = await res.json()
    const breakdown = dto?.breakdown || {}
    const statuses = ["Paid", "Pending", "Overdue"]
    // Try to augment/override Pending with JSON-derived values
    const jsonPending = await getPendingFromJson().catch(() => null)
    return statuses.map((s) => {
      if (s === "Pending" && jsonPending) {
        return {
          status: s as any,
          count: jsonPending.count,
          total: jsonPending.total,
          percentage: dto.totalInvoices ? Math.round((jsonPending.count / dto.totalInvoices) * 100) : 0,
        }
      }
      return {
        status: s as any,
        count: breakdown[s]?.count ?? 0,
        total: Number(breakdown[s]?.amount ?? 0),
        percentage: Number(breakdown[s]?.percentage ?? 0) ?? 0,
      }
    })
  } catch {
    return []
  }
}

export async function getInconsistentInvoices(): Promise<Invoice[]> {
  if (!BASE) {
    await delay(300)
    return mockInvoices.filter((inv) => !inv.is_consistent)
  }

  try {
    // backend route is /api/reports/inconsistents
    const res = await fetch(`${BASE}/api/reports/inconsistents`)
    if (!res.ok) return []
    const dto = await res.json()
    // Inconsistent DTOs contain invoice numbers and amounts; map minimally
    return dto.map((d: any) => ({
      id: d.id,
      invoice_number: String(d.invoiceNumber ?? d.InvoiceNumber ?? d.invoice_number),
      client_name: d.customerName ?? d.CustomerName ?? "",
      issue_date: (d.invoiceDate || d.InvoiceDate) ? new Date(d.invoiceDate || d.InvoiceDate).toISOString().split("T")[0] : "",
      payment_due_date: "",
      total_amount: Number(d.totalAmount ?? d.TotalAmount ?? 0),
      credit_applied: 0,
      balance: 0,
      invoice_status: "",
      payment_status: "",
      is_consistent: false,
      products: [],
      credit_notes: [],
      products_sum: Number(d.itemsTotal ?? d.ItemsTotal ?? 0),
    }))
  } catch {
    return []
  }
}
