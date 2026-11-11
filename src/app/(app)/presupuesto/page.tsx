import type { Metadata } from "next";
import { AllowanceCard } from "@/components/allowance-card";
import { BudgetManager, type BudgetLine } from "@/components/budget-manager";
import { MonthNav } from "@/components/month-nav";
import { PageHeader } from "@/components/page-header";
import { monthRange, todayInCordoba } from "@/lib/dates";
import { parseMonthParam } from "@/lib/periods";
import { getBudgets, findTotalBudget } from "@/lib/queries/budgets";
import { getCategories } from "@/lib/queries/categories";
import { getExpenseAmounts } from "@/lib/queries/expenses";
import { sumExpenses, totalsByCategory } from "@/lib/stats";

export const metadata: Metadata = { title: "Presupuesto" };

export default async function PresupuestoPage({ searchParams }: PageProps<"/presupuesto">) {
  const params = await searchParams;
  const today = todayInCordoba();
  const monthDate = parseMonthParam(params.mes, monthRange(today).start);
  const month = monthRange(monthDate);

  const [budgets, categories, expenses] = await Promise.all([
    getBudgets(month.start),
    getCategories(),
    getExpenseAmounts(month),
  ]);

  // Los presupuestos comparan contra mi parte (my_share), no contra lo que pagué.
  const spentByCategory = new Map(totalsByCategory(expenses, "share").map((item) => [item.categoryId, item.total]));
  const budgetByCategory = new Map(budgets.filter((b) => b.category_id).map((b) => [b.category_id, b]));
  const total = findTotalBudget(budgets);
  const totalSpent = sumExpenses(expenses, "share");

  const lines: BudgetLine[] = [
    {
      categoryId: null,
      name: "Total del mes",
      color: null,
      spent: totalSpent,
      budgetId: total?.id ?? null,
      budget: total?.amount ?? null,
    },
    ...categories
      // Las archivadas solo aparecen si ya tienen un presupuesto en este mes.
      .filter((category) => !category.is_archived || budgetByCategory.has(category.id))
      .map((category) => {
        const budget = budgetByCategory.get(category.id);
        return {
          categoryId: category.id,
          name: category.name,
          color: category.color,
          spent: spentByCategory.get(category.id) ?? 0,
          budgetId: budget?.id ?? null,
          budget: budget?.amount ?? null,
        };
      }),
  ];

  return (
    <>
      <PageHeader title="Presupuesto" description="Topes mensuales: total y por categoría. Cuentan tu parte de cada gasto." />
      <MonthNav basePath="/presupuesto" monthDate={monthDate} today={today} />

      {total ? (
        <div className="mb-6">
          <AllowanceCard budget={total.amount} spent={totalSpent} month={month} today={today} />
        </div>
      ) : (
        <p className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Definí el tope total del mes para ver cuánto podés gastar por día.
        </p>
      )}

      <BudgetManager month={month.start.slice(0, 7)} lines={lines} />
    </>
  );
}
