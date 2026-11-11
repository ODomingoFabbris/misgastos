import type { NextRequest } from "next/server";
import { centsToDecimal, sanitizeCsvText, toCsv } from "@/lib/csv";
import { todayInCordoba } from "@/lib/dates";
import { getAllExpenses } from "@/lib/queries/expenses";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validators/category";

/**
 * Exporta los gastos a CSV respetando los mismos filtros que la pantalla Gastos
 * (?q, ?categoria, ?desde, ?hasta). Exige sesión; los datos los filtra RLS.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return new Response("Tu sesión venció. Volvé a iniciar sesión.", { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const category = params.get("categoria");

  const expenses = await getAllExpenses({
    q: params.get("q") ?? undefined,
    categoryId: category && idSchema.safeParse(category).success ? category : undefined,
    from: params.get("desde") ?? undefined,
    to: params.get("hasta") ?? undefined,
  });

  const csv = toCsv(
    ["Fecha", "Categoría", "Nota", "Total pagado", "Mi parte", "Compartido"],
    expenses.map((expense) => [
      expense.spent_on,
      sanitizeCsvText(expense.category?.name ?? ""),
      sanitizeCsvText(expense.note ?? ""),
      centsToDecimal(expense.amount_total),
      centsToDecimal(expense.my_share),
      expense.is_shared ? "Sí" : "No",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gastos-${todayInCordoba()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
