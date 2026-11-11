/**
 * Solo la URL y la Publishable key (la protección real son las reglas por fila, RLS).
 * Nunca usar la Secret key / service_role en este proyecto.
 *
 * Sin prefijo NEXT_PUBLIC_: se leen solo en el servidor (proxy, Server Components y
 * Server Actions). No existe cliente de Supabase en el navegador.
 */
export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en .env.local.");
  }

  return { url, publishableKey };
}
