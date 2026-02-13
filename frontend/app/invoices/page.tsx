import { redirect } from "next/navigation"

export default function RedirectInvoices() {
  redirect("/dashboard/invoices")
  return null
}
