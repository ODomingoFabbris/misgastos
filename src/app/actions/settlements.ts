"use server";

import { revalidatePath } from "next/cache";
import { translateDbError, type ActionResult } from "@/lib/action-result";
import { todayInCordoba } from "@/lib/dates";
import { getBrotherBalance } from "@/lib/queries/settlements";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validators/category";

const NOT_LOGGED_IN = "Tu sesión venció. Volvé a iniciar sesión.";

async function getAuthedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : supabase;
}

/**
 * "Saldar": registra que el hermano devolvió todo lo que se le debe hoy. El monto se
 * calcula acá, en el servidor, nunca viene del navegador.
 */
export async function settleBalance(): Promise<ActionResult> {
  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { balance } = await getBrotherBalance();
  if (balance <= 0) return { ok: false, error: "No hay saldo pendiente para saldar." };

  const { error } = await supabase
    .from("settlements")
    .insert({ amount: balance, settled_on: todayInCordoba() });
  if (error) return { ok: false, error: translateDbError(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Deshace un "saldar" hecho por error. */
export async function deleteSettlement(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase.from("settlements").delete().eq("id", parsedId.data);
  if (error) return { ok: false, error: translateDbError(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}
