import type { Metadata } from "next";
import { IncomeManager } from "@/components/income-manager";
import { MonthNav } from "@/components/month-nav";
import { PageHeader } from "@/components/page-header";
import { monthRange, todayInCordoba } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { parseMonthParam } from "@/lib/periods";
import { getExpenseAmounts } from "@/lib/queries/expenses";
import { getIncomes } from "@/lib/queries/incomes";
import { sumExpenses } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { INCOME_SOURCES, INCOME_SOURCE_LABELS } from "@/lib/validators/income";

export const metadata: Metadata = { title: "Ingresos" };

export default async function IngresosPage({ searchParams }: PageProps<"/ingresos">) {
  const params = await searchParams;
  const today = todayInCordoba();
  const monthDate = parseMonthParam(params.mes, monthRange(today).start);
  const month = monthRange(monthDate);

  const [incomes, expenses] = await Promise.all([getIncomes(month), getExpenseAmounts(month)]);

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const spent = sumExpenses(expenses, "share");
  const balance = totalIncome - spent;

  const bySource = INCOME_SOURCES.map((source) => ({
    source,
    total: incomes.filter((income) => income.source === source).reduce((sum, income) => sum + income.amount, 0),
  })).filter((item) => item.total > 0);

  return (
    <>
      <PageHeader title="Ingresos" description="Lo que mandan tus padres y lo que entra por tus trabajos." />
      <MonthNav basePath="/ingresos" monthDate={monthDate} today={today} />

      <section className="mb-6 rounded-xl border border-border bg-card p-4" aria-label="Balance del mes">
        <p className="text-sm text-muted-foreground">Ingresos del mes</p>
        <p className="mt-1 text-3xl font-semibold text-success">{formatCents(totalIncome)}</p>

        {bySource.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {bySource.map((item) => (
              <li key={item.source} className="flex justify-between">
                <span className="text-muted-foreground">{INCOME_SOURCE_LABELS[item.source]}</span>
                <span>{formatCents(item.total)}</span>
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-4 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Gastado (mi parte)</dt>
            <dd>{formatCents(spent)}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt>Balance</dt>
            <dd className={cn(balance >= 0 ? "text-success" : "text-destructive")}>
              {balance < 0 ? "−" : ""}
              {formatCents(Math.abs(balance))}
            </dd>
          </div>
        </dl>
      </section>

      <IncomeManager incomes={incomes} today={today} />
    </>
  );
}
