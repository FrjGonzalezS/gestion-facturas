import { JsonImport } from "@/components/ui/json-import"

export default function CargarJsonPage() {
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cargar JSON</h2>
      <JsonImport />
    </div>
  )
}
