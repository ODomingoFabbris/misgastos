"use server";

import { revalidatePath } from "next/cache";
import { translateDbError, type ActionResult } from "@/lib/action-result";
import { toBudgetRow } from "@/lib/rows";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validators/category";
import { budgetSchema, type BudgetValues } from "@/lib/validators/budget";

const NOT_LOGGED_IN = "Tu sesión venció. Volvé a iniciar sesión.";

async function getAuthedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : supabase;
}

/** Crea el presupuesto del mes/categoría o actualiza su monto si ya existe. */
export async function saveBudget(values: BudgetValues): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const row = toBudgetRow(parsed.data);

  // Se busca a mano: un índice único con category_id nulo no siempre detecta el duplicado.
  let lookup = supabase.from("budgets").select("id").eq("month", row.month);
  lookup = row.category_id === null ? lookup.is("category_id", null) : lookup.eq("category_id", row.category_id);
  const { data: existing, error: lookupError } = await lookup.limit(1).maybeSingle();
  if (lookupError) return { ok: false, error: translateDbError(lookupError) };

  const { error } = existing
    ? await supabase.from("budgets").update({ amount: row.amount }).eq("id", existing.id)
    : await supabase.from("budgets").insert(row);

  if (error) {
    return { ok: false, error: translateDbError(error, { duplicate: "Ya hay un presupuesto para ese mes." }) };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase.from("budgets").delete().eq("id", parsedId.data);
  if (error) return { ok: false, error: translateDbError(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}
