import { ExpenseSheet } from "@/components/expense-sheet";
import { todayInCordoba } from "@/lib/dates";
import { getCategories } from "@/lib/queries/categories";

/** Carga categorías y fecha de hoy (datos de la sesión) para la hoja. Va dentro de <Suspense>. */
export async function ExpenseSheetHost() {
  const categories = await getCategories();
  return <ExpenseSheet categories={categories} today={todayInCordoba()} />;
}
