import "server-only";
import { brotherBalance, type BrotherBalance, type SharedExpenseAmounts } from "@/lib/balance";
import { createClient } from "@/lib/supabase/server";
import type { Settlement } from "@/types/database";

/** Supabase devuelve como máximo 1000 filas por consulta; se pide por tandas. */
const BATCH = 1000;

/** Montos de todos los gastos compartidos (sin límite de fechas: el saldo es acumulado). */
async function getSharedExpenseAmounts(): Promise<SharedExpenseAmounts[]> {
  const supabase = await createClient();
  const rows: SharedExpenseAmounts[] = [];

  for (let from = 0; ; from += BATCH) {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount_total, my_share")
      .eq("is_shared", true)
      .order("id", { ascending: true })
      .range(from, from + BATCH - 1);

    if (error) throw new Error("No pudimos calcular el saldo.");
    rows.push(...(data as SharedExpenseAmounts[]));
    if (data.length < BATCH) break;
  }

  return rows;
}

/** Liquidaciones registradas, de la más nueva a la más vieja. */
export async function getSettlements(): Promise<Settlement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .order("settled_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error("No pudimos cargar los saldos saldados.");
  return data;
}

/** Saldo con el hermano (lo que puse por él menos lo que ya me devolvió). */
export async function getBrotherBalance(): Promise<BrotherBalance & { settlements: Settlement[] }> {
  const [shared, settlements] = await Promise.all([getSharedExpenseAmounts(), getSettlements()]);
  return {
    ...brotherBalance(
      shared,
      settlements.map((settlement) => settlement.amount),
    ),
    settlements,
  };
}
