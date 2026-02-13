"use client"


import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react"


export function JsonImport() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || ""
  const [files, setFiles] = useState<string[] | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [lastImported, setLastImported] = useState<string>("");
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const dropRef = useRef<HTMLLabelElement>(null)

  useEffect(() => {
    if (!BASE) return
    fetch(`${BASE}/api/json-files/`)
      .then((r) => r.json())
      .then((list) => setFiles(list))
      .catch(() => setFiles([]))
    // Consultar el último archivo importado
    fetch(`${BASE}/api/json-files/last-imported`)
      .then((r) => r.json())
      .then((name) => {
        if (typeof name === "string") setLastImported(name)
        else setLastImported("")
      })
      .catch(() => setLastImported(""))
  }, [BASE])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setLocalFile(f)
    setLocalFileName(f.name)
    setSelectedFile(null)
    setSuccessMsg(null)
    setErrorMsg(null)
  }

  // Drag & drop
  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f && f.type === "application/json") {
      setLocalFile(f)
      setLocalFileName(f.name)
      setSelectedFile(null)
      setSuccessMsg(null)
      setErrorMsg(null)
    } else {
      setErrorMsg("Solo se permiten archivos .json")
    }
  }

  const uploadLocalFile = async () => {
    if (!BASE || !localFile) throw new Error("No backend o no local file")
    setUploading(true)
    setErrorMsg(null)
    try {
      const fd = new FormData()
      fd.append("file", localFile)
      const res = await fetch(`${BASE}/api/json-files/upload`, { method: "POST", body: fd })
      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      setFiles((prev) => (prev ? [body.fileName, ...prev] : [body.fileName]))
      setSelectedFile(body.fileName)
      setLocalFile(null)
      setLocalFileName(null)
      setSuccessMsg("Archivo subido correctamente: " + body.fileName)
      return body.fileName
    } catch (err: any) {
      setErrorMsg("Error subiendo archivo: " + String(err))
      throw err
    } finally {
      setUploading(false)
    }
  }

  const onImport = async (fileName?: string) => {
    setSuccessMsg(null)
    setErrorMsg(null)
    if (!BASE) {
      setErrorMsg("Backend no configurado. Configure NEXT_PUBLIC_BACKEND_URL")
      return
    }
    setImporting(true)
    try {
      let name = fileName || selectedFile
      if (!name && localFile) {
        try {
          name = await uploadLocalFile()
        } catch (err: any) {
          setImporting(false)
          return
        }
      }
      if (!name) {
        setErrorMsg("Seleccione un archivo JSON para importar")
        setImporting(false)
        return
      }
      const res = await fetch(`${BASE}/api/invoices/import?fileName=${encodeURIComponent(name)}`, { method: "POST" })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Error importando")
      }
      const body = await res.json()
      setSuccessMsg(`Importación completada: ${body.inserted} facturas insertadas`)
      // Refrescar toda la web para limpiar el estado y trabajar solo con el nuevo JSON
      setTimeout(() => window.location.reload(), 1200)
    } catch (err: any) {
      setErrorMsg("Error importando: " + String(err))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" /> Cargar JSON
        </h2>
        <p className="text-base text-muted-foreground mb-4">Importa facturas desde un archivo JSON local o selecciona uno ya subido al servidor.</p>
      </div>

      {/* Feedback visual */}
      {successMsg && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded px-3 py-2">
          <CheckCircle2 className="w-5 h-5" /> <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded px-3 py-2">
          <FileText className="w-5 h-5" /> <span>{errorMsg}</span>
        </div>
      )}

      {/* Sección 1: Subir archivo local */}
      <div>
        <h3 className="text-lg font-semibold mb-2">1. Subir desde tu PC</h3>
        <label
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="flex flex-col items-center justify-center border-2 border-dashed border-primary/40 rounded-lg p-6 cursor-pointer bg-muted hover:bg-primary/10 transition mb-2"
        >
          <input type="file" accept="application/json" onChange={onFileChange} className="hidden" />
          <Upload className="w-10 h-10 text-primary mb-2" />
          <span className="font-medium">Arrastra tu archivo JSON aquí o haz clic para seleccionarlo</span>
          {localFileName && <span className="mt-2 text-sm text-primary font-semibold">{localFileName}</span>}
        </label>
        <Button
          className="w-full mt-2"
          onClick={() => onImport()}
          disabled={importing || uploading || (!localFile && !selectedFile)}
        >
          {uploading || importing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
          Importar archivo local
        </Button>
      </div>

      {/* Mostrar el archivo JSON actualmente cargado/activo */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Archivo JSON en uso</h3>
        {lastImported ? (
          <div className="flex items-center gap-2 text-primary font-medium">
            <FileText className="w-5 h-5" />
            <span>{lastImported}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no se ha importado ningún archivo JSON.</p>
        )}
      </div>
    </div>
  )
}
