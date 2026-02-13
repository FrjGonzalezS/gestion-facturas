export function formatCLP(amount: number): string {
  return `$ ${amount.toLocaleString("es-CL")}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
