import { Scissors } from "lucide-react";
import { findHaircutCategory, haircutReminder } from "@/lib/haircut";
import { getLastExpenseDate } from "@/lib/queries/expenses";
import type { Category } from "@/types/database";

/**
 * Aviso de peluquería a las 2-3 semanas del último corte. Se apoya en la categoría
 * "Peluquería": si no existe o todavía no tiene gastos, no muestra nada.
 */
export async function HaircutReminderCard({ categories, today }: { categories: Category[]; today: string }) {
  const category = findHaircutCategory(categories);
  if (!category) return null;

  const reminder = haircutReminder(await getLastExpenseDate(category.id), today);
  if (!reminder) return null;

  return (
    <section
      aria-label="Recordatorio de peluquería"
      className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card p-4"
    >
      <Scissors className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-sm">
        {reminder.level === "overdue"
          ? `Hace ${reminder.days} días que no vas a la peluquería.`
          : `Ya pasaron ${reminder.days} días desde tu último corte: se acerca el momento.`}
      </p>
    </section>
  );
}
