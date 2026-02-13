# Gestión de Facturas

Este proyecto es un monorepo que contiene:
- **frontend/**: Aplicación web (Next.js + TypeScript) para gestión y visualización de facturas.
- **backend/**: API REST (.NET 8) para importación, consulta y administración de facturas.

---

## Requisitos

- Node.js 18+ y npm (para el frontend)
- .NET 8 SDK (para el backend)

---

## Instalación y uso

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/gestion-facturas.git
cd gestion-facturas
```
Crear archivo .env.local en carpeta Frontend si no está, y escribir NEXT_PUBLIC_BACKEND_URL=https://localhost:61664

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```
- Accede a `http://localhost:3000` en tu navegador.
- Puedes importar archivos JSON de facturas desde la sección "Cargar JSON".

### 3. Backend (API .NET)

```bash
cd backend
# Opcional: restaurar dependencias
# dotnet restore
# Ejecutar la API
 dotnet run
```
- La API estará disponible en `https://localhost:61664` y `http://localhost:61665`.
- El frontend se conecta automáticamente si la variable `NEXT_PUBLIC_BACKEND_URL` está configurada (ver `.env.local` en frontend).

---

## Estructura del proyecto

```
gestion-facturas/
├── frontend/   # Next.js (toda la UI)
├── backend/    # API .NET (toda la lógica y datos)
└── README.md   # Instrucciones y guía
```

