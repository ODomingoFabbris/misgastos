/** Tipos de las tablas de Supabase usadas hasta ahora (ver CLAUDE.md > Base de datos). */

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  category_id: string;
  /** Centavos. Lo que pagó el usuario. */
  amount_total: number;
  /** Centavos. La parte del usuario (igual a amount_total si no es compartido). */
  my_share: number;
  is_shared: boolean;
  /** Fecha calendario yyyy-MM-dd. */
  spent_on: string;
  note: string | null;
  recurring_id: string | null;
  created_at: string;
};

export type CategorySummary = Pick<Category, "id" | "name" | "color" | "is_archived">;

export type ExpenseWithCategory = Expense & { category: CategorySummary | null };

export type IncomeSource = "familia" | "freelance" | "otro";

export type Income = {
  id: string;
  user_id: string;
  source: IncomeSource;
  /** Centavos. */
  amount: number;
  /** Fecha calendario yyyy-MM-dd. */
  received_on: string;
  client: string | null;
  note: string | null;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  /** null = tope total del mes. */
  category_id: string | null;
  /** Primer día del mes, yyyy-MM-01. */
  month: string;
  /** Centavos. */
  amount: number;
  created_at: string;
};

export type RecurringItem = {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  /** Centavos. */
  amount: number;
  is_shared: boolean;
  /** Centavos. */
  my_share: number;
  /** 1 a 28. */
  day_of_month: number;
  active: boolean;
  /** Primer día del último mes para el que se generó el gasto (lo agrega la migración 0002). */
  last_generated_month: string | null;
  created_at: string;
};

export type Settlement = {
  id: string;
  user_id: string;
  /** Centavos que el hermano devolvió. */
  amount: number;
  /** Fecha calendario yyyy-MM-dd. */
  settled_on: string;
  note: string | null;
  created_at: string;
};
