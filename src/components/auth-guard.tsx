import { requireUser } from "@/lib/auth";

/** Verifica la sesión antes de mostrar una ruta privada. Va dentro de un <Suspense>. */
export async function AuthGuard({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
