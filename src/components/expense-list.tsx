"use client";

import { useExpenseSheet } from "@/components/expense-sheet-context";
import { formatDayLabel } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import type { ExpenseWithCategory } from "@/types/database";

type Day = { date: string; expenses: ExpenseWithCategory[]; total: number };

function groupByDay(expenses: ExpenseWithCategory[]): Day[] {
  const days: Day[] = [];
  for (const expense of expenses) {
    const last = days[days.length - 1];
    if (last && last.date === expense.spent_on) {
      last.expenses.push(expense);
      last.total += expense.my_share;
    } else {
      days.push({ date: expense.spent_on, expenses: [expense], total: expense.my_share });
    }
  }
  return days;
}

/** Lista agrupada por día (llega ordenada por fecha). Tocar un gasto abre su edición. */
export function ExpenseList({ expenses, today }: { expenses: ExpenseWithCategory[]; today: string }) {
  const { openEdit } = useExpenseSheet();

  return (
    <div className="flex flex-col gap-6">
      {groupByDay(expenses).map((day) => (
        <section key={day.date} aria-label={formatDayLabel(day.date, today)}>
          <header className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-medium">{formatDayLabel(day.date, today)}</h2>
            <span className="text-sm text-muted-foreground">{formatCents(day.total)}</span>
          </header>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {day.expenses.map((expense) => {
              const { category, ...row } = expense;
              return (
                <li key={expense.id}>
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface"
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: category?.color ?? "#8a8a8a" }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{expense.note || category?.name || "Sin categoría"}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {expense.note ? category?.name : null}
                        {expense.note && expense.is_shared ? " · " : null}
                        {expense.is_shared ? "Compartido" : null}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-medium">{formatCents(expense.my_share)}</span>
                      {expense.is_shared && (
                        <span className="block text-xs text-muted-foreground">
                          de {formatCents(expense.amount_total)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
