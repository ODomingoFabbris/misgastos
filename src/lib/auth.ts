import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
};

/**
 * Capa de acceso: verifica la sesión contra Supabase Auth (getUser) y devuelve
 * solo lo necesario. Lee cookies, así que debe llamarse dentro de un <Suspense>.
 * Las reglas por fila (RLS) siguen siendo la protección real de los datos.
 */
export async function requireUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/login");

  return { id: data.user.id, email: data.user.email ?? "" };
}
