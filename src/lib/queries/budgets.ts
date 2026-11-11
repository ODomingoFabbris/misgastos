import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Budget } from "@/types/database";

/** Presupuestos de un mes (`monthStart` = "yyyy-MM-01"): el tope total y los de cada categoría. */
export async function getBudgets(monthStart: string): Promise<Budget[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("budgets").select("*").eq("month", monthStart);

  if (error) throw new Error("No pudimos cargar los presupuestos.");
  return data;
}

/** Atajo: el tope total del mes (category_id nulo), si existe. */
export function findTotalBudget(budgets: Budget[]): Budget | undefined {
  return budgets.find((budget) => budget.category_id === null);
}
