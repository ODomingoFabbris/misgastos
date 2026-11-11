"use server";

import { revalidatePath } from "next/cache";
import { translateDbError, type ActionResult } from "@/lib/action-result";
import { toExpenseRow } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validators/category";
import { expenseSchema, type ExpenseValues } from "@/lib/validators/expense";

const NOT_LOGGED_IN = "Tu sesión venció. Volvé a iniciar sesión.";

async function getAuthedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : supabase;
}

function refresh() {
  revalidatePath("/", "layout");
}

/** Las categorías archivadas no aceptan gastos nuevos (sí conservan los viejos). */
async function isCategoryUsable(
  supabase: NonNullable<Awaited<ReturnType<typeof getAuthedClient>>>,
  categoryId: string,
  currentCategoryId?: string,
) {
  if (categoryId === currentCategoryId) return true;
  const { data } = await supabase
    .from("categories")
    .select("is_archived")
    .eq("id", categoryId)
    .maybeSingle();
  return Boolean(data) && !data?.is_archived;
}

export async function createExpense(values: ExpenseValues): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  if (!(await isCategoryUsable(supabase, parsed.data.categoryId))) {
    return { ok: false, error: "Elegí una categoría activa." };
  }

  const { error } = await supabase.from("expenses").insert(toExpenseRow(parsed.data));
  if (error) return { ok: false, error: translateDbError(error) };

  refresh();
  return { ok: true };
}

export async function updateExpense(id: string, values: ExpenseValues): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = expenseSchema.safeParse(values);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { data: current } = await supabase
    .from("expenses")
    .select("category_id")
    .eq("id", parsedId.data)
    .maybeSingle();
  if (!current) return { ok: false, error: "El gasto ya no existe." };

  if (!(await isCategoryUsable(supabase, parsed.data.categoryId, current.category_id))) {
    return { ok: false, error: "Elegí una categoría activa." };
  }

  const { error } = await supabase
    .from("expenses")
    .update(toExpenseRow(parsed.data))
    .eq("id", parsedId.data);
  if (error) return { ok: false, error: translateDbError(error) };

  refresh();
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase.from("expenses").delete().eq("id", parsedId.data);
  if (error) return { ok: false, error: translateDbError(error) };

  refresh();
  return { ok: true };
}
