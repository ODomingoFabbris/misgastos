"use server";

import { revalidatePath } from "next/cache";
import { translateDbError, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { categorySchema, idSchema, type CategoryValues } from "@/lib/validators/category";

const NOT_LOGGED_IN = "Tu sesión venció. Volvé a iniciar sesión.";

/** Cliente de Supabase solo si hay sesión válida. user_id lo completa la base (auth.uid()). */
async function getAuthedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : supabase;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createCategory(values: CategoryValues): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, sort_order: (last?.sort_order ?? 0) + 1 });

  if (error) return { ok: false, error: translateDbError(error, { duplicate: "Ya tenés una categoría con ese nombre." }) };
  refresh();
  return { ok: true };
}

export async function updateCategory(id: string, values: CategoryValues): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = categorySchema.safeParse(values);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase.from("categories").update(parsed.data).eq("id", parsedId.data);

  if (error) return { ok: false, error: translateDbError(error, { duplicate: "Ya tenés una categoría con ese nombre." }) };
  refresh();
  return { ok: true };
}

export async function setCategoryArchived(id: string, archived: boolean): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { error } = await supabase
    .from("categories")
    .update({ is_archived: archived })
    .eq("id", parsedId.data);

  if (error) return { ok: false, error: translateDbError(error) };
  refresh();
  return { ok: true };
}

/** Sube o baja una categoría reescribiendo `sort_order` de toda la lista (0, 1, 2…). */
export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .order("name", { ascending: true });

  if (error) return { ok: false, error: translateDbError(error) };

  const ids = data.map((row) => row.id);
  const from = ids.indexOf(parsedId.data);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) return { ok: true };

  [ids[from], ids[to]] = [ids[to], ids[from]];

  const results = await Promise.all(
    ids.map((categoryId, index) =>
      supabase.from("categories").update({ sort_order: index }).eq("id", categoryId),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return { ok: false, error: translateDbError(failed.error) };

  refresh();
  return { ok: true };
}

/**
 * Borra una categoría sin gastos. Si tiene gastos no la borra: devuelve
 * `has_expenses` para que la interfaz ofrezca mover los gastos o archivarla.
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: parsedId.error.issues[0].message };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { count, error: countError } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("category_id", parsedId.data);

  if (countError) return { ok: false, error: translateDbError(countError) };
  if (count && count > 0) {
    return {
      ok: false,
      code: "has_expenses",
      expenseCount: count,
      error: "La categoría tiene gastos. Podés moverlos a otra categoría o archivarla.",
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", parsedId.data);
  if (error) {
    // Un gasto pudo cargarse entre el conteo y el borrado.
    if (error.code === "23503") {
      return {
        ok: false,
        code: "has_expenses",
        error: "La categoría tiene gastos. Podés moverlos a otra categoría o archivarla.",
      };
    }
    return { ok: false, error: translateDbError(error) };
  }

  refresh();
  return { ok: true };
}

/** Mueve todos los gastos de una categoría a otra y después borra la primera. */
export async function moveExpensesAndDeleteCategory(
  id: string,
  targetId: string,
): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsedTarget = idSchema.safeParse(targetId);
  if (!parsedId.success || !parsedTarget.success) {
    return { ok: false, error: "Identificador inválido." };
  }
  if (parsedId.data === parsedTarget.data) {
    return { ok: false, error: "Elegí una categoría distinta para mover los gastos." };
  }

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: NOT_LOGGED_IN };

  const { data: target, error: targetError } = await supabase
    .from("categories")
    .select("id, is_archived")
    .eq("id", parsedTarget.data)
    .maybeSingle();

  if (targetError) return { ok: false, error: translateDbError(targetError) };
  if (!target || target.is_archived) {
    return { ok: false, error: "La categoría de destino no existe o está archivada." };
  }

  const { error: moveError } = await supabase
    .from("expenses")
    .update({ category_id: target.id })
    .eq("category_id", parsedId.data);
  if (moveError) return { ok: false, error: translateDbError(moveError) };

  const { error: deleteError } = await supabase.from("categories").delete().eq("id", parsedId.data);
  if (deleteError) return { ok: false, error: translateDbError(deleteError) };

  refresh();
  return { ok: true };
}
