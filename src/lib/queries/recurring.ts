import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { RecurringItem } from "@/types/database";

/** Gastos fijos del usuario: primero los activos, ordenados por día del mes. */
export async function getRecurringItems(): Promise<RecurringItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_items")
    .select("*")
    .order("active", { ascending: false })
    .order("day_of_month", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error("No pudimos cargar los gastos fijos.");
  return data;
}
