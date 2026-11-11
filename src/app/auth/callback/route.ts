import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino del link del email de confirmación: Supabase redirige acá con `?code=`.
 * Se canjea por una sesión y se entra a la app. Si el código no sirve (vencido o ya
 * usado) se va al login: la cuenta igual quedó confirmada y se puede ingresar a mano.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
