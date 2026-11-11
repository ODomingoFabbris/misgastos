import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const PUBLIC_PATHS = ["/login", "/registro"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Refresca la sesión de Supabase en cada request y hace la verificación
 * optimista de rutas privadas. La verificación real está en `requireUser`
 * (src/lib/auth.ts) y en las reglas por fila (RLS) de la base.
 */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getClaims valida la firma del JWT; no usar getSession() acá.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!isLoggedIn && !isPublicPath(pathname)) {
    return redirectTo(request, "/login", response);
  }

  if (isLoggedIn && isPublicPath(pathname)) {
    return redirectTo(request, "/", response);
  }

  return response;
}

function redirectTo(request: NextRequest, pathname: string, from: NextResponse) {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  // Conservar las cookies de sesión que Supabase haya refrescado.
  for (const cookie of from.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
