import "server-only";
import { isValidDate, type DateRange } from "@/lib/dates";
import type { ExpenseAmounts } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseWithCategory } from "@/types/database";

export type ExpenseFilters = {
  q?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  /** Solo gastos compartidos con el hermano. */
  sharedOnly?: boolean;
};

/** Tope de filas por consulta. La paginación llega si hace falta más adelante. */
export const EXPENSES_PAGE_LIMIT = 300;

/** Escapa los comodines de LIKE para buscar el texto tal cual. */
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Gastos del usuario (RLS filtra por user_id), del más nuevo al más viejo. */
export async function getExpenses(
  filters: ExpenseFilters = {},
  limit: number = EXPENSES_PAGE_LIMIT,
  offset = 0,
): Promise<ExpenseWithCategory[]> {
  const supabase = await createClient();

  let query = supabase
    .from("expenses")
    .select("*, category:categories(id, name, color, is_archived)")
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  const q = filters.q?.trim();
  if (q) query = query.ilike("note", `%${escapeLike(q)}%`);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.from && isValidDate(filters.from)) query = query.gte("spent_on", filters.from);
  if (filters.to && isValidDate(filters.to)) query = query.lte("spent_on", filters.to);
  if (filters.sharedOnly) query = query.eq("is_shared", true);

  const { data, error } = await query;
  if (error) throw new Error("No pudimos cargar los gastos.");

  return data as ExpenseWithCategory[];
}

/** Supabase devuelve como máximo 1000 filas por consulta; se pide por tandas. */
const AMOUNTS_BATCH = 1000;

/**
 * Montos de todos los gastos de un rango de fechas, para totales y gráficos.
 * Trae solo las columnas necesarias y recorre todas las tandas (sin truncar).
 */
export async function getExpenseAmounts(range: DateRange): Promise<ExpenseAmounts[]> {
  const supabase = await createClient();
  const rows: ExpenseAmounts[] = [];

  for (let from = 0; ; from += AMOUNTS_BATCH) {
    const { data, error } = await supabase
      .from("expenses")
      .select("spent_on, amount_total, my_share, category_id")
      .gte("spent_on", range.start)
      .lte("spent_on", range.end)
      .order("spent_on", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + AMOUNTS_BATCH - 1);

    if (error) throw new Error("No pudimos cargar los gastos.");
    rows.push(...(data as ExpenseAmounts[]));
    if (data.length < AMOUNTS_BATCH) break;
  }

  return rows;
}

/** Todos los gastos que cumplen los filtros (para exportar), recorriendo las tandas de a 1000. */
export async function getAllExpenses(filters: ExpenseFilters = {}): Promise<ExpenseWithCategory[]> {
  const rows: ExpenseWithCategory[] = [];

  for (let offset = 0; ; offset += AMOUNTS_BATCH) {
    const batch = await getExpenses(filters, AMOUNTS_BATCH, offset);
    rows.push(...batch);
    if (batch.length < AMOUNTS_BATCH) break;
  }

  return rows;
}

/** Fecha del gasto más reciente de una categoría, o null si todavía no tiene gastos. */
export async function getLastExpenseDate(categoryId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("spent_on")
    .eq("category_id", categoryId)
    .order("spent_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("No pudimos cargar los gastos.");
  return data?.spent_on ?? null;
}
