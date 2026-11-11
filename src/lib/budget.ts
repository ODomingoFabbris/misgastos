import { daysInRange, diffInDays, type DateRange } from "@/lib/dates";

/** Cálculos de presupuesto. Todo en centavos enteros. */

export type BudgetStatus = {
  spent: number;
  budget: number;
  /** budget - spent. Negativo si se pasó. */
  remaining: number;
  /** Porcentaje usado, redondeado y sin tope (120 = se pasó un 20%). */
  percent: number;
  exceeded: boolean;
};

export function budgetStatus(spent: number, budget: number): BudgetStatus {
  return {
    spent,
    budget,
    remaining: budget - spent,
    percent: budget > 0 ? Math.round((spent / budget) * 100) : 0,
    exceeded: spent > budget,
  };
}

export type DailyAllowance = {
  /** Lo que queda del mes (puede ser negativo). */
  remaining: number;
  /** Días que faltan contando hoy. 0 si el mes ya terminó. */
  daysLeft: number;
  /** Lo que se puede gastar por día, en centavos enteros (hacia abajo). 0 si ya se pasó. */
  perDay: number;
};

/**
 * "Cuánto puedo gastar por día": lo que queda del tope mensual dividido los
 * días que faltan, contando hoy. Antes de que empiece el mes cuenta todos sus días.
 */
export function dailyAllowance(budget: number, spent: number, month: DateRange, today: string): DailyAllowance {
  const remaining = budget - spent;
  const daysLeft = today > month.end ? 0 : today < month.start ? daysInRange(month) : diffInDays(today, month.end) + 1;
  const perDay = remaining > 0 && daysLeft > 0 ? Math.floor(remaining / daysLeft) : 0;
  return { remaining, daysLeft, perDay };
}
