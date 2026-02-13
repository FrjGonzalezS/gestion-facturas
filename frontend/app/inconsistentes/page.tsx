import { redirect } from "next/navigation"

export default function RedirectInconsistentes() {
  redirect("/dashboard/inconsistentes")
  return null
}
