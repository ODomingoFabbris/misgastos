import "server-only";
import type { DateRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Income } from "@/types/database";

/** Tope de filas por consulta (un mes de ingresos personales queda muy por debajo). */
const INCOMES_LIMIT = 500;

/** Ingresos de un rango de fechas, del más nuevo al más viejo. */
export async function getIncomes(range: DateRange): Promise<Income[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .gte("received_on", range.start)
    .lte("received_on", range.end)
    .order("received_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(INCOMES_LIMIT);

  if (error) throw new Error("No pudimos cargar los ingresos.");
  return data;
}
