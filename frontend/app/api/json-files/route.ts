import { NextRequest } from "next/server"

export async function GET(_request: NextRequest) {
  // Placeholder: the UI calls the backend directly when NEXT_PUBLIC_BACKEND_URL is set.
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
