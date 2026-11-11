# Mis gastos

Gestor de gastos personal, pensado primero para el celular. Registra gastos e ingresos y muestra
cuánto se gasta por semana y por mes, y en qué categorías. Moneda: pesos argentinos (ARS).
Zona horaria: America/Argentina/Cordoba.

El documento de referencia del proyecto (stack, reglas, diseño y base de datos) es [`CLAUDE.md`](./CLAUDE.md).

## Stack

Next.js (App Router) · TypeScript estricto · Tailwind CSS + shadcn/ui · Recharts ·
Supabase (Postgres + Auth) · React Hook Form + Zod · date-fns · Vitest · Vercel.

## Puesta en marcha

1. Seguir [`supabase/SETUP.md`](./supabase/SETUP.md): base de datos, autenticación y variables de entorno.
2. Copiar `.env.example` a `.env.local` y completar `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`.
3. Instalar y levantar:

```bash
npm install
npm run dev
```

La app queda en [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run test` | Tests (Vitest): dinero, fechas, totales, presupuestos, CSV, etc. |

## Estructura

```
src/app/(auth)/        login y registro (públicas)
src/app/(app)/         pantallas privadas: inicio, gastos, resumen, categorías,
                       presupuesto, ingresos, gastos fijos, saldo con el hermano, más
src/app/actions/       Server Actions (mutaciones, siempre validadas con Zod)
src/app/auth/callback  destino del link del email de confirmación
src/lib/               dinero, fechas, cálculos, validadores, consultas y clientes de Supabase
supabase/migrations/   migraciones SQL numeradas
supabase/audit/        script de auditoría de seguridad (RLS)
```

## Seguridad

- Toda tabla tiene `user_id` y seguridad por fila (RLS): cada usuario ve solo sus datos.
- Solo se usa la Publishable key. **Nunca** la Secret key / `service_role`.
- Las variables de entorno se leen solo en el servidor.
