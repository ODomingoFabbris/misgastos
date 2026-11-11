# Puesta en marcha (Supabase + Vercel)

Guía para dejar la app funcionando en local y publicada. Los nombres de variables y rutas son
los que usa el código.

## 1. Base de datos (Supabase)

1. Crear el proyecto en Supabase.
2. En **SQL Editor**, ejecutar en orden: `migrations/0001_init.sql` y `migrations/0002_recurring_and_settlements.sql`.
   Cualquier cambio futuro va en una migración nueva numerada, nunca editando las anteriores.
3. Ejecutar `audit/rls_check.sql` bloque por bloque y comparar con el "Esperado" de cada uno.

## 2. Variables de entorno

Archivo `.env.local` en local (nunca en Git) y **Settings → Environment Variables** en Vercel
(marcar Production, Preview y Development):

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

Se copian de Supabase → **Project Settings → API** (URL del proyecto y Publishable key).
**Nunca** usar la Secret key / `service_role`: saltea la seguridad por fila y no hace falta.
Las variables se leen solo en el servidor (no llevan prefijo `NEXT_PUBLIC_`).

## 3. Autenticación (Supabase → Authentication)

1. **Sign In / Providers → Email**: activar **Confirm email**.
2. **URL Configuration**:
   - **Site URL**: la URL final de producción, por ejemplo `https://mis-gastos.vercel.app`.
   - **Redirect URLs** (una por línea):
     - `https://mis-gastos.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
3. El link del email de confirmación vuelve a `/auth/callback`, que entra a la app con la sesión
   iniciada. Si el link vence, la cuenta igual queda confirmada y se puede ingresar desde `/login`.
4. El servicio de email incluido en Supabase tiene un límite bajo de envíos por hora. Para uso
   personal alcanza; si hiciera falta más, se configura un SMTP propio.

## 4. Publicación (Vercel)

1. Importar el repositorio de GitHub en Vercel (plan Hobby, uso personal no comercial).
2. Cargar las dos variables del punto 2.
3. Desplegar y copiar la URL final a **Site URL** y **Redirect URLs** del punto 3.
   Las URLs de preview de Vercel cambian en cada despliegue: para probar el registro ahí hay que
   agregarlas a **Redirect URLs** o probar en producción.

## 5. Verificación después de publicar

- Crear una cuenta nueva: llega el email, el link abre la app con la sesión iniciada y aparecen
  las 15 categorías iniciales.
- Cerrar sesión e ingresar de nuevo.
- Abrir una ruta privada (`/gastos`) sin sesión: redirige a `/login`.
- Desde el celular, abrir la URL y usar "Agregar a pantalla de inicio" (la PWA requiere HTTPS).
