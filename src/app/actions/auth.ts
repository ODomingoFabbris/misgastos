"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signupSchema,
  type AuthActionResult,
  type LoginValues,
  type SignupValues,
} from "@/lib/validators/auth";

function translateAuthError(error: { message: string; code?: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Email o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Confirmá tu email antes de ingresar. Revisá tu casilla.";
    case "user_already_exists":
    case "email_exists":
      return "Ya existe una cuenta con ese email.";
    case "weak_password":
      return "La contraseña es demasiado débil. Probá con una más larga.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Demasiados intentos. Esperá unos minutos y probá de nuevo.";
    default:
      return "No pudimos completar la operación. Probá de nuevo en un momento.";
  }
}

export async function login(values: LoginValues): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: translateAuthError(error) };

  redirect("/");
}

export async function signup(values: SignupValues): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // El link del email vuelve al mismo sitio desde el que se registró (local o producción).
  // Supabase solo acepta URLs que estén en su lista de "Redirect URLs".
  const origin = (await headers()).get("origin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: origin ? { emailRedirectTo: `${origin}/auth/callback` } : undefined,
  });
  if (error) return { error: translateAuthError(error) };

  // Con la confirmación de email activa no hay sesión hasta confirmar.
  if (!data.session) {
    return { message: "Te enviamos un email para confirmar tu cuenta. Después podés iniciar sesión." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
