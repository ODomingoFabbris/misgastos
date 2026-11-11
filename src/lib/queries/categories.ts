import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

/** Todas las categorías del usuario (RLS filtra por user_id), en el orden elegido. */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error("No pudimos cargar las categorías.");
  return data;
}

/** Cantidad de gastos por categoría, para mostrar y para decidir cómo borrar. */
export async function getExpenseCountsByCategory(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("category_id");

  if (error) throw new Error("No pudimos cargar las categorías.");

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}
