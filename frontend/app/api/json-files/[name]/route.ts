import { NextRequest } from "next/server"

export async function GET(_request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const p = await context.params
  const name = p?.name
  return new Response(JSON.stringify({ error: "Not found", name }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  })
}
