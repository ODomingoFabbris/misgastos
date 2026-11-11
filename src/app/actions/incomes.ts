"use server";

import { revalidatePath } from "next/cache";
import { translateDbError, type ActionResult } from "@/lib/action-result";
import { toIncomeRow } from "@/lib/rows";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validators/category";
import { incomeSchema, type IncomeValues } from "@/lib/validators/income";

const NOT_LOGGED_IN = "Tu sesión venció. Volvé a iniciar sesión.";

async function getAuthedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : supabase;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createIncome(values: IncomeValues): Promise<ActionResult> {
  const parsed = incomeSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase.from("incomes").insert(toIncomeRow(parsed.data));
  if (error) return { ok: false, error: translateDbError(error) };

  refresh();
  return { ok: true };
}

export async function updateIncome(id: string, values: IncomeValues): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = incomeSchema.safeParse(values);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase.from("incomes").update(toIncomeRow(parsed.data)).eq("id", parsedId.data);
  if (error) return { ok: false, error: translateDbError(error) };

  refresh();
  return { ok: true };
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase.from("incomes").delete().eq("id", parsedId.data);
  if (error) return { ok: false, error: translateDbError(error) };

  refresh();
  return { ok: true };
}
