/** Saldo con el hermano. Todo en centavos enteros. */

export type SharedExpenseAmounts = { amount_total: number; my_share: number };

export type BrotherBalance = {
  /** Suma de (amount_total - my_share) de los gastos compartidos: lo que puse por él. */
  owed: number;
  /** Suma de lo ya saldado. */
  settled: number;
  /** owed - settled. Positivo: te debe. Negativo: le debés. */
  balance: number;
};

export function brotherBalance(shared: SharedExpenseAmounts[], settlementAmounts: number[]): BrotherBalance {
  const owed = shared.reduce((sum, expense) => sum + (expense.amount_total - expense.my_share), 0);
  const settled = settlementAmounts.reduce((sum, amount) => sum + amount, 0);
  return { owed, settled, balance: owed - settled };
}
