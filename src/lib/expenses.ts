import { centsToInputValue, parsePesosToCents } from "@/lib/money";
import type { Expense } from "@/types/database";
import type { ExpenseValues } from "@/lib/validators/expense";

/** Mitad del total en centavos enteros. Si sobra un centavo lo absorbe el hermano. */
export function halfShare(totalCents: number): number {
  return Math.floor(totalCents / 2);
}

export type ExpenseRow = Pick<
  Expense,
  "category_id" | "amount_total" | "my_share" | "is_shared" | "spent_on" | "note"
>;

/** Convierte valores ya validados del formulario a las columnas de la tabla `expenses`. */
export function toExpenseRow(values: ExpenseValues): ExpenseRow {
  const total = parsePesosToCents(values.amount);
  if (total === null) throw new Error("Monto inválido.");

  let share = total;
  if (values.isShared) {
    const typed = values.myShare.trim() === "" ? null : parsePesosToCents(values.myShare);
    share = typed ?? halfShare(total);
  }

  return {
    category_id: values.categoryId,
    amount_total: total,
    my_share: share,
    is_shared: values.isShared,
    spent_on: values.spentOn,
    note: values.note === "" ? null : values.note,
  };
}

/** Valores iniciales del formulario al editar un gasto existente. */
export function expenseToFormValues(expense: Expense): ExpenseValues {
  return {
    amount: centsToInputValue(expense.amount_total),
    categoryId: expense.category_id,
    spentOn: expense.spent_on,
    note: expense.note ?? "",
    isShared: expense.is_shared,
    myShare: expense.is_shared ? centsToInputValue(expense.my_share) : "",
  };
}
