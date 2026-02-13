import { redirect } from "next/navigation"

export default function RedirectReports() {
  redirect("/dashboard/reports")
  return null
}
