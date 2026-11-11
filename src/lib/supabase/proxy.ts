import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/** Pantallas de acceso: si ya hay sesión, se redirige al inicio. */
const AUTH_PAGES = ["/login", "/registro"];
/** Rutas accesibles sin sesión. /auth/callback recibe el link del email de confirmación. */
const PUBLIC_PATHS = [...AUTH_PAGES, "/auth/callback"];

function matches(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

const isPublicPath = (pathname: string) => matches(pathname, PUBLIC_PATHS);
const isAuthPage = (pathname: string) => matches(pathname, AUTH_PAGES);

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

  if (isLoggedIn && isAuthPage(pathname)) {
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
