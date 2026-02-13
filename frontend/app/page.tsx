"use client"

import { redirect } from "next/navigation"

export default function HomeRedirect() {
  redirect("/dashboard")
  return null
}
