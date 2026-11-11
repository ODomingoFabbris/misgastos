import { halfShare } from "@/lib/expenses";
import { centsToInputValue, parsePesosToCents } from "@/lib/money";
import type { Budget, Income, RecurringItem } from "@/types/database";
import type { RecurringValues } from "@/lib/validators/recurring";
import type { BudgetValues } from "@/lib/validators/budget";
import type { IncomeValues } from "@/lib/validators/income";

/** Conversión entre valores de formulario y columnas de `budgets` / `incomes`. */

export type BudgetRow = Pick<Budget, "category_id" | "month" | "amount">;

export function toBudgetRow(values: BudgetValues): BudgetRow {
  const amount = parsePesosToCents(values.amount);
  if (amount === null) throw new Error("Monto inválido.");
  return {
    category_id: values.categoryId === "" ? null : values.categoryId,
    month: `${values.month}-01`,
    amount,
  };
}

export type IncomeRow = Pick<Income, "source" | "amount" | "received_on" | "client" | "note">;

export function toIncomeRow(values: IncomeValues): IncomeRow {
  const amount = parsePesosToCents(values.amount);
  if (amount === null) throw new Error("Monto inválido.");
  return {
    source: values.source,
    amount,
    received_on: values.receivedOn,
    // El cliente solo tiene sentido para ingresos freelance.
    client: values.source === "freelance" && values.client !== "" ? values.client : null,
    note: values.note === "" ? null : values.note,
  };
}

export function incomeToFormValues(income: Income): IncomeValues {
  return {
    source: income.source,
    amount: centsToInputValue(income.amount),
    receivedOn: income.received_on,
    client: income.client ?? "",
    note: income.note ?? "",
  };
}

export type RecurringRow = Pick<
  RecurringItem,
  "category_id" | "name" | "amount" | "is_shared" | "my_share" | "day_of_month" | "active"
>;

export function toRecurringRow(values: RecurringValues): RecurringRow {
  const amount = parsePesosToCents(values.amount);
  if (amount === null) throw new Error("Monto inválido.");

  let share = amount;
  if (values.isShared) {
    const typed = values.myShare.trim() === "" ? null : parsePesosToCents(values.myShare);
    share = typed ?? halfShare(amount);
  }

  return {
    category_id: values.categoryId,
    name: values.name,
    amount,
    is_shared: values.isShared,
    my_share: share,
    day_of_month: values.dayOfMonth,
    active: values.active,
  };
}

export function recurringToFormValues(item: RecurringItem): RecurringValues {
  return {
    name: item.name,
    amount: centsToInputValue(item.amount),
    categoryId: item.category_id,
    dayOfMonth: item.day_of_month,
    isShared: item.is_shared,
    myShare: item.is_shared ? centsToInputValue(item.my_share) : "",
    active: item.active,
  };
}
