import { addDays, daysInRange, diffInDays, weeksOfMonth, type DateRange, type WeekOfMonth } from "@/lib/dates";

/**
 * Cálculos de totales. Todo en centavos enteros.
 * "share" suma `my_share` (lo que gasté yo, el valor por defecto de los reportes);
 * "paid" suma `amount_total` (lo que pagué, incluida la parte del hermano).
 */
export type AmountMode = "share" | "paid";

export type ExpenseAmounts = {
  spent_on: string;
  amount_total: number;
  my_share: number;
  category_id: string;
};

export function amountOf(expense: ExpenseAmounts, mode: AmountMode): number {
  return mode === "paid" ? expense.amount_total : expense.my_share;
}

export function filterByRange<T extends { spent_on: string }>(expenses: T[], range: DateRange): T[] {
  return expenses.filter((expense) => expense.spent_on >= range.start && expense.spent_on <= range.end);
}

export function sumExpenses(expenses: ExpenseAmounts[], mode: AmountMode): number {
  return expenses.reduce((sum, expense) => sum + amountOf(expense, mode), 0);
}

export type CategoryTotal = { categoryId: string; total: number };

/** Total por categoría, de mayor a menor. Omite las categorías sin gasto. */
export function totalsByCategory(expenses: ExpenseAmounts[], mode: AmountMode): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(expense.category_id, (totals.get(expense.category_id) ?? 0) + amountOf(expense, mode));
  }
  return [...totals.entries()]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export type DayTotal = { date: string; total: number };

/** Un total por cada día del rango, incluidos los días sin gastos (en cero). */
export function totalsByDay(expenses: ExpenseAmounts[], range: DateRange, mode: AmountMode): DayTotal[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(expense.spent_on, (totals.get(expense.spent_on) ?? 0) + amountOf(expense, mode));
  }

  const days: DayTotal[] = [];
  for (let offset = 0; offset < daysInRange(range); offset++) {
    const date = addDays(range.start, offset);
    days.push({ date, total: totals.get(date) ?? 0 });
  }
  return days;
}

export type Comparison = {
  /** actual - anterior, en centavos. */
  diff: number;
  /** Variación porcentual redondeada; null si el período anterior fue cero. */
  percent: number | null;
  direction: "up" | "down" | "same";
};

export function comparePeriods(current: number, previous: number): Comparison {
  const diff = current - previous;
  return {
    diff,
    percent: previous === 0 ? null : Math.round((diff / previous) * 100),
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
  };
}

/**
 * Promedio diario en centavos enteros. En el período en curso se divide por los
 * días transcurridos hasta hoy; en un período cerrado, por todos sus días.
 */
export function dailyAverage(total: number, range: DateRange, today: string): number {
  if (today < range.start) return 0;
  const elapsedDays = today >= range.end ? daysInRange(range) : diffInDays(range.start, today) + 1;
  return Math.round(total / elapsedDays);
}

export type WeekSummary = WeekOfMonth & {
  total: number;
  /** Categoría con más gasto en esa semana; null si no hubo gastos. */
  topCategoryId: string | null;
};

/** Una fila por semana del mes (recortada a sus límites) con total y categoría principal. */
export function weekSummaries(expenses: ExpenseAmounts[], monthDate: string, mode: AmountMode): WeekSummary[] {
  return weeksOfMonth(monthDate).map((week) => {
    const inWeek = filterByRange(expenses, week);
    return {
      ...week,
      total: sumExpenses(inWeek, mode),
      topCategoryId: totalsByCategory(inWeek, mode)[0]?.categoryId ?? null,
    };
  });
}
