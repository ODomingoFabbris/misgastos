"use server";

import { revalidatePath } from "next/cache";
import { translateDbError, type ActionResult } from "@/lib/action-result";
import { todayInCordoba } from "@/lib/dates";
import { toRecurringRow } from "@/lib/rows";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validators/category";
import { recurringSchema, type RecurringValues } from "@/lib/validators/recurring";

const NOT_LOGGED_IN = "Tu sesión venció. Volvé a iniciar sesión.";

async function getAuthedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : supabase;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createRecurring(values: RecurringValues): Promise<ActionResult> {
  const parsed = recurringSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase.from("recurring_items").insert(toRecurringRow(parsed.data));
  if (error) return { ok: false, error: translateDbError(error) };

  refresh();
  return { ok: true };
}

export async function updateRecurring(id: string, values: RecurringValues): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = recurringSchema.safeParse(values);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase
    .from("recurring_items")
    .update(toRecurringRow(parsed.data))
    .eq("id", parsedId.data);
  if (error) return { ok: false, error: translateDbError(error) };

  refresh();
  return { ok: true };
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase.from("recurring_items").delete().eq("id", parsedId.data);
  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "Ya generó gastos, así que no se puede borrar. Pausalo para que deje de generarse." };
    }
    return { ok: false, error: translateDbError(error) };
  }

  refresh();
  return { ok: true };
}

/**
 * Genera los gastos fijos del mes que ya vencieron (función `generate_recurring_expenses`
 * de la migración 0002). Es idempotente: la app puede llamarla cada vez que se abre.
 */
export async function syncRecurringExpenses(): Promise<{ created: number }> {
  const supabase = await getAuthedClient();
  if (!supabase) return { created: 0 };

  const { data, error } = await supabase.rpc("generate_recurring_expenses", { p_today: todayInCordoba() });
  // Sin la migración aplicada la función no existe: no es un error para el usuario.
  if (error || typeof data !== "number") return { created: 0 };

  if (data > 0) refresh();
  return { created: data };
}
