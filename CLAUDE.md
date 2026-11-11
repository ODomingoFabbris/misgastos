# Gestor de gastos personal

Web app privada, pensada primero para el celular, para registrar gastos y ver cuánto se gasta **por semana, semana a semana y por mes**, y en qué categorías. Es de uso personal de una sola persona, pero el diseño soporta varios usuarios (cada uno ve solo sus datos).

## Cómo trabajamos (leer primero)

- El proyecto se construye **por pasos largos** (ver "Estado de los pasos"). Se hace **solo el paso actual**, completo y funcionando de punta a punta, antes de pasar al siguiente. No adelantar funciones de pasos futuros.
- No marcar pasos como terminados ni editar la sección "Estado de los pasos" por cuenta propia. Al terminar un paso, entregar un **resumen para actualizar este archivo**: qué se hizo, archivos y carpetas clave, decisiones tomadas, variables o configuraciones nuevas, y cualquier cosa pendiente. El usuario actualiza este archivo con ese resumen.
- Al cerrar cada paso correr: `npm run lint`, `npm run test` (cuando existan tests) y `npm run build`. Corregir todo lo que falle antes de dar el paso por terminado.
- Responder y comentar en **español** (Argentina). Nombres de código (variables, funciones, tablas) en inglés, como ya está en la base.
- Ante una duda de producto, elegir la opción más simple que respete este documento y avisar qué se eligió.

## Contexto del usuario

Estudiante de Ingeniería en Sistemas (UTN FRC) de Catamarca que vive en Nueva Córdoba, Córdoba capital, con ayuda económica de sus padres. Vive con su hermano, por lo que algunos gastos se dividen en dos. Planea empezar a vender webs y automatizaciones, así que más adelante la app también registra ingresos. Moneda: pesos argentinos (ARS). Zona horaria: America/Argentina/Cordoba (UTC-3).

## Stack

| Pieza | Elección |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript estricto |
| Estilos / componentes | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts (vía componentes de gráficos de shadcn) |
| Base de datos y login | Supabase (Postgres + Auth con email y contraseña), paquete `@supabase/ssr` |
| Formularios y validación | React Hook Form + Zod (mismos esquemas en cliente y servidor) |
| Fechas | date-fns (+ `@date-fns/tz`) con zona America/Argentina/Cordoba |
| Pruebas | Vitest para cálculo de semanas, meses y totales |
| Publicación | Vercel (plan Hobby, uso personal no comercial) conectado a GitHub |

Sin ORM: se consulta con el cliente de Supabase. Mutaciones con Server Actions. Si la versión de Next instalada usa `proxy.ts` en lugar de `middleware.ts` para interceptar requests, usar la que corresponda (verificar en la documentación de esa versión).

## Variables de entorno

Archivo `.env.local` (nunca en Git; `.env.example` sin valores sí va en el repo):

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

- La Publishable key es segura en el navegador porque la protección real son las reglas por fila (RLS) de la base.
- **Nunca** usar, pedir ni pegar la Secret key / `service_role`: saltea la seguridad por fila. No hace falta en este proyecto.
- No leer `.env` ni `.env.local` (están bloqueados en `.claude/settings.json`).

## Reglas técnicas que no se negocian

1. **Dinero en enteros, en centavos** (`bigint` en la base, `number` entero en TypeScript). Nunca decimales flotantes. El usuario escribe pesos (ej. `12.500,50`) y se convierte a centavos al guardar. Formato visual argentino con `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`. Centralizar la conversión y el formato en `src/lib/money.ts`.
2. **Fechas**: `spent_on` y `received_on` son tipo `date` (sin hora). "Hoy" se calcula siempre en la zona de Córdoba, nunca en la del servidor ni la del navegador. La **semana va de lunes a domingo**. Centralizar en `src/lib/dates.ts` y cubrir con tests (cambio de mes a mitad de semana, domingo a lunes, fin de año).
3. **Reportes suman `my_share`** (la parte del usuario), no `amount_total`. Debe existir una opción para ver "lo que pagué" (`amount_total`) cuando sea útil.
4. **Seguridad**: toda tabla tiene `user_id` y RLS activo. Nunca depender solo del filtro en el código. Las rutas privadas exigen sesión.
5. **Mobile-first**: diseñar a 390 px de ancho y ampliar a escritorio. Botones y zonas táctiles de 44 px o más.
6. Las categorías **no se hardcodean** en el código: se leen de la tabla `categories` (el usuario las crea, edita y borra).
7. Validar con Zod en el servidor aunque el formulario ya valide. Manejar y mostrar errores en español.

## Diseño

Estilo serio y formal: fondo negro, superficies grises, texto claro. Rojo y verde solo como detalles con significado; las categorías usan colores apagados distintos para no confundirse con ellos.

| Uso | Hex |
| --- | --- |
| Fondo | `#0A0A0A` |
| Tarjetas / superficies | `#141414` y `#1C1C1C` |
| Bordes y divisores | `#2A2A2A` |
| Texto principal | `#EDEDED` |
| Texto secundario | `#8A8A8A` |
| Botón principal (texto negro) | `#E5E5E5` |
| Rojo: gasto, exceso de presupuesto, borrar | `#E5484D` |
| Verde: ingreso, dentro de presupuesto, confirmar | `#3FB67A` |

- Tema oscuro fijo (modo claro opcional en el futuro). Definir los colores como variables CSS / tokens de Tailwind, no como valores sueltos en los componentes.
- Tipografía Inter con números tabulares (`tabular-nums`) para que los montos se alineen.
- Navegación en celular: barra inferior (Inicio, Gastos, botón central "+", Resumen, Más). En escritorio: menú lateral.
- Agregar gasto: hoja que sube desde abajo, teclado numérico abierto, categorías como botones de color, fecha en hoy por defecto. Meta: cargar un gasto en menos de 10 segundos.
- Confirmar siempre antes de borrar. Comparaciones con el período anterior: flecha roja si subió el gasto, verde si bajó.

## Base de datos (Supabase / Postgres)

Fuente de verdad: `supabase/migrations/0001_init.sql` (ya aplicada en Supabase). Guía de puesta en marcha en `supabase/SETUP.md`. Cualquier cambio futuro va en una **nueva migración numerada** (`0002_...sql`), nunca editando la anterior.

Los usuarios los maneja Supabase Auth (`auth.users`). Todas las tablas propias llevan `user_id uuid default auth.uid()` con `on delete cascade`, de modo que al insertar desde la app no hace falta enviar `user_id`.

### Tablas

| Tabla | Campos | Reglas |
| --- | --- | --- |
| `categories` | `id`, `user_id`, `name` (1-40), `color` (hex `#RRGGBB`), `icon`, `is_archived`, `sort_order`, `created_at` | Nombre único por usuario sin distinguir mayúsculas. |
| `expenses` | `id`, `user_id`, `category_id`, `amount_total` (centavos, >0), `my_share` (centavos), `is_shared`, `spent_on` (date, por defecto hoy en Córdoba), `note` (≤200), `recurring_id`, `created_at` | `my_share` ≤ `amount_total`; si `is_shared` es falso, `my_share` = `amount_total`. Si no se envía `my_share`, un disparador lo iguala a `amount_total`. |
| `incomes` | `id`, `user_id`, `source` (`familia`, `freelance`, `otro`), `amount` (>0), `received_on`, `client`, `note`, `created_at` | Para lo que mandan los padres y lo que entra por webs y automatizaciones. |
| `budgets` | `id`, `user_id`, `category_id` (nulo = tope total del mes), `month` (primer día del mes), `amount` (>0), `created_at` | Único por usuario, categoría y mes. |
| `recurring_items` | `id`, `user_id`, `category_id`, `name`, `amount`, `is_shared`, `my_share`, `day_of_month` (1-28), `active`, `created_at` | Gastos fijos (gimnasio, alquiler, suscripciones). Mismas reglas de `my_share` que `expenses`. |

### Comportamientos importantes

- **Seguridad por fila (RLS)** activada en las cinco tablas: política `for all to authenticated` con `user_id = auth.uid()`. En `expenses`, `recurring_items` y `budgets` además se exige que la `category_id` pertenezca al mismo usuario.
- **Categorías iniciales**: al crearse un usuario en `auth.users`, un disparador (`on_auth_user_created`) inserta sus 15 categorías (tabla de abajo). Los usuarios que se registren desde la app las reciben solos.
- **Borrar una categoría con gastos falla** (`on delete restrict`, error de clave foránea). El flujo en la app: si tiene gastos, ofrecer *mover los gastos a otra categoría* y luego borrar, o *archivarla* (`is_archived = true`). Las categorías archivadas no aparecen al cargar gastos nuevos pero conservan el historial. Al borrar una categoría, sus presupuestos se borran en cascada.
- Un gasto compartido con el hermano se guarda con `is_shared = true`, `amount_total` = lo que pagó el usuario y `my_share` = su parte (normalmente la mitad). El saldo con el hermano (futuro) se calcula como la suma de `amount_total - my_share` de los gastos compartidos.
- Para totales por semana o mes, agrupar en la consulta por rango de `spent_on` y sumar `my_share`. Los rangos se calculan con las utilidades de `src/lib/dates.ts`.

### Categorías iniciales (editables por el usuario)

| Categoría | Color |
| --- | --- |
| Comida | `#E0A458` |
| Delivery | `#D98E73` |
| Gimnasio | `#5B8DB8` |
| Alcohol | `#A66FB5` |
| Peluquería | `#6FB7B0` |
| Salidas | `#C77DA3` |
| Ropa | `#7C83D9` |
| Gastos extras | `#B8A17A` |
| Gastos casuales | `#8FA3AD` |
| Alquiler y expensas | `#9A9A9A` |
| Servicios | `#6C7A89` |
| Transporte | `#4F9DA6` |
| Facultad | `#D6C36A` |
| Viajes a Catamarca | `#B07A5B` |
| Suscripciones y trabajo | `#8C6FD0` |

Significado de cada una: Comida es supermercado y verdulería; Delivery es pedir comida; Alcohol son bebidas para salidas o el finde; Peluquería es el corte cada 2 o 3 semanas; Salidas es cine, cenas, meriendas y juntadas; Gastos extras es algo material (cargador, mouse, mochila); Gastos casuales son compras improvisadas con amigos; Facultad son fotocopias, apuntes y materiales de la UTN; Viajes a Catamarca son pasajes y encomiendas; Suscripciones y trabajo son Spotify, dominios, hosting y herramientas.

## Funcionalidades

**MVP**: registro, inicio y cierre de sesión; carga rápida de gasto; lista por día con búsqueda y filtros (categoría, rango de fechas), editar y borrar; totales por semana, semana a semana y por mes con comparación contra el período anterior y promedio diario; torta por categoría y barras por día o semana; categorías editables (crear, renombrar, color, archivar, borrar); gasto compartido x2.

**v1.1**: presupuesto mensual (tope total y por categoría, barra verde que pasa a roja al excederlo); ingresos (familia, freelance con cliente); "cuánto puedo gastar por día" (lo que queda del mes dividido los días restantes).

**v1.2**: gastos fijos recurrentes que se generan solos cada mes; saldo con el hermano con botón "saldar"; recordatorio de peluquería a las 2-3 semanas del último corte; exportar a CSV; PWA instalable.

**Futuro**: metas de ahorro, alerta de gastos hormiga (categoría "Gastos casuales" sobre un monto semanal), alertas al 80% del tope, foto del ticket, modo claro, tablero de ingresos por cliente.

## Pantallas

1. **Ingreso / Registro**: email y contraseña, con enlace para alternar entre crear cuenta e iniciar sesión.
2. **Inicio**: selector Semana / Mes, total gastado, comparación con el período anterior, torta por categoría, barras por día, últimos gastos.
3. **Gastos**: lista por día con filtros; tocar un gasto abre la edición y el borrado.
4. **Agregar gasto**: hoja inferior (descrita en Diseño).
5. **Resumen**: una fila por cada semana del mes con total y categoría principal, más el total mensual. Responde directamente "cuánto gasto cada semana y al mes".
6. **Categorías**: crear, editar color, ordenar, archivar y borrar.
7. **Presupuesto e ingresos** (v1.1).
8. **Ajustes**: moneda, día de inicio de semana, cerrar sesión.

## Estructura de carpetas sugerida

```
src/
  app/
    (auth)/login, (auth)/registro     # pantallas públicas
    (app)/                            # rutas privadas con layout móvil
      page.tsx (Inicio), gastos/, resumen/, categorias/, ajustes/
  components/ui/                      # shadcn
  components/                         # componentes propios (ExpenseSheet, CategoryBadge, etc.)
  lib/
    supabase/ (client.ts, server.ts)  # clientes de @supabase/ssr
    money.ts, dates.ts, validators/   # utilidades y esquemas Zod
    queries/                          # consultas reutilizables por tabla
  types/                              # tipos de la base
supabase/migrations/                  # migraciones SQL numeradas
```

Es una guía: se puede ajustar si hay una razón, avisando.

## Estado de los pasos

Cada paso es grande y se cierra con lint, tests y build en verde. Estados: pendiente, en curso, terminado.

- **Paso 0 — Preparación: terminado.** Proyecto Next.js creado. Proyecto de Supabase creado y migración `0001_init.sql` aplicada (5 tablas, RLS, disparador de categorías iniciales). `.claude/settings.json` con bloqueos de lectura. Este `CLAUDE.md`.
- **Paso 1 — Fundaciones, diseño y cuentas: pendiente.** Instalar shadcn/ui, Recharts, React Hook Form, Zod, date-fns y Vitest. Aplicar tema oscuro con los tokens de color. Layout móvil con barra inferior y menú lateral en escritorio. Clientes de Supabase con `@supabase/ssr`, interceptor de sesión, rutas privadas. Registro, inicio y cierre de sesión. `money.ts` y `dates.ts` con tests. Primer despliegue en Vercel con las variables de entorno.
- **Paso 2 — Categorías y gastos: pendiente.** Pantalla de categorías completa (crear, renombrar, color, ordenar, archivar, borrar con mover gastos). Hoja de agregar gasto, lista por día con filtros y búsqueda, editar y borrar, gasto compartido.
- **Paso 3 — Inicio y Resumen: pendiente.** Totales de semana y mes con comparación y promedio diario, torta por categoría, barras por día, tabla semana a semana, opción de ver "lo que pagué" vs "mi parte".
- **Paso 4 — Presupuestos e ingresos (v1.1): pendiente.** Migración `0002` si hace falta, pantallas de presupuesto e ingresos, "cuánto puedo gastar por día".
- **Paso 5 — Recurrentes, saldo y extras (v1.2): pendiente.** Gastos fijos automáticos, saldo con el hermano, recordatorio de peluquería, exportar CSV, PWA.
- **Paso 6 — Pulido y publicación: pendiente.** Revisión a 390 px, accesibilidad, revisión de seguridad de las reglas de la base, reactivar confirmación de email en Supabase, URL final en Supabase y Vercel.

## Historial de decisiones

(Se completa al cerrar cada paso con el resumen que entrega Claude Code.)