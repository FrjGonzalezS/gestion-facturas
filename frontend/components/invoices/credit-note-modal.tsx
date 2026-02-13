"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createCreditNote } from "@/lib/api"
import { formatCLP } from "@/lib/format"
import type { Invoice } from "@/lib/types"

interface CreditNoteModalProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreditNoteModal({
  invoice,
  open,
  onOpenChange,
  onSuccess,
}: CreditNoteModalProps) {
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!invoice) return
    const numAmount = Number(amount)

    if (!numAmount || numAmount <= 0) {
      setError("Ingrese un monto válido mayor a 0")
      return
    }
    if (numAmount > invoice.balance) {
      setError(
        `El monto no puede superar el saldo pendiente (${formatCLP(invoice.balance)})`
      )
      return
    }

    setSubmitting(true)
    setError("")

    try {
      await createCreditNote(invoice.id, numAmount)
      toast.success("Nota de crédito agregada exitosamente")
      setAmount("")
      onSuccess()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear nota de crédito"
      toast.error(message)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setAmount("")
      setError("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nota de Crédito</DialogTitle>
          <DialogDescription>
            Factura: {invoice?.invoice_number} - {invoice?.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm text-muted-foreground">
              Saldo pendiente
            </span>
            <span className="font-mono font-semibold">
              {invoice ? formatCLP(invoice.balance) : "—"}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cn-amount">Monto (CLP)</Label>
            <Input
              id="cn-amount"
              type="number"
              placeholder="Ej: 100000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError("")
              }}
              min={1}
              max={invoice?.balance}
              aria-describedby="cn-error"
            />
            {error && (
              <p id="cn-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            La fecha de creación se asignará automáticamente al confirmar.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
