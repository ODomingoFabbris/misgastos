import Link from "next/link";
import { Suspense } from "react";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { AllowanceCard } from "@/components/allowance-card";
import { Comparison } from "@/components/comparison";
import { DayBars, type DayBar } from "@/components/charts";
import { ExpenseList } from "@/components/expense-list";
import { HaircutReminderCard } from "@/components/haircut-reminder-card";
import { PageHeader } from "@/components/page-header";
import { SegmentedLinks } from "@/components/segmented-links";
import {
  dayOfMonth,
  formatDayLabel,
  formatMonthLabel,
  formatRange,
  formatWeekdayInitial,
  monthRange,
  previousMonthRange,
  previousWeekRange,
  todayInCordoba,
  weekRange,
} from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { buildHref, parseAmountMode, parsePeriod } from "@/lib/periods";
import { findTotalBudget, getBudgets } from "@/lib/queries/budgets";
import { getCategories } from "@/lib/queries/categories";
import { getExpenseAmounts, getExpenses } from "@/lib/queries/expenses";
import {
  comparePeriods,
  dailyAverage,
  filterByRange,
  sumExpenses,
  totalsByCategory,
  totalsByDay,
} from "@/lib/stats";

export default async function InicioPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const period = parsePeriod(params.periodo);
  const mode = parseAmountMode(params.ver);

  const today = todayInCordoba();
  const current = period === "semana" ? weekRange(today) : monthRange(today);
  const previous = period === "semana" ? previousWeekRange(today) : previousMonthRange(today);

  // El presupuesto es mensual: una sola consulta cubre el período, el anterior y el mes en curso.
  const thisMonth = monthRange(today);
  const fetchRange = {
    start: previous.start < thisMonth.start ? previous.start : thisMonth.start,
    end: current.end > thisMonth.end ? current.end : thisMonth.end,
  };

  const [amounts, categories, latest, budgets] = await Promise.all([
    getExpenseAmounts(fetchRange),
    getCategories(),
    getExpenses({}, 5),
    getBudgets(thisMonth.start),
  ]);

  const monthBudget = findTotalBudget(budgets);
  // Los presupuestos se miden contra mi parte, sin importar el selector de arriba.
  const monthSpent = sumExpenses(filterByRange(amounts, thisMonth), "share");

  const currentExpenses = filterByRange(amounts, current);
  const previousExpenses = filterByRange(amounts, previous);

  const total = sumExpenses(currentExpenses, mode);
  const previousTotal = sumExpenses(previousExpenses, mode);
  const comparison = comparePeriods(total, previousTotal);
  const average = dailyAverage(total, current, today);

  const bars: DayBar[] = totalsByDay(currentExpenses, current, mode).map((day) => ({
    label: period === "semana" ? formatWeekdayInitial(day.date) : dayOfMonth(day.date),
    fullLabel: formatDayLabel(day.date, today),
    total: day.total,
  }));

  const title = period === "semana" ? "Esta semana" : formatMonthLabel(today);
  const subtitle = period === "semana" ? formatRange(current) : "Lo que va del mes";
  const previousLabel = period === "semana" ? "la semana anterior" : "el mes anterior";
  const modeLabel = mode === "paid" ? "Lo que pagué" : "Mi parte";

  return (
    <>
      <PageHeader title="Inicio" />

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="md:flex-1">
          <SegmentedLinks
            label="Período"
            options={[
              { label: "Semana", href: buildHref("/", { ver: params.ver === "pague" ? "pague" : undefined }), active: period === "semana" },
              {
                label: "Mes",
                href: buildHref("/", { periodo: "mes", ver: params.ver === "pague" ? "pague" : undefined }),
                active: period === "mes",
              },
            ]}
          />
        </div>
        <div className="md:flex-1">
          <SegmentedLinks
            label="Qué monto ver"
            options={[
              { label: "Mi parte", href: buildHref("/", { periodo: period === "mes" ? "mes" : undefined }), active: mode === "share" },
              {
                label: "Lo que pagué",
                href: buildHref("/", { periodo: period === "mes" ? "mes" : undefined, ver: "pague" }),
                active: mode === "paid",
              },
            ]}
          />
        </div>
      </div>

      <section className="mb-4 rounded-xl border border-border bg-card p-4" aria-label="Total del período">
        <p className="text-sm text-muted-foreground">
          {title} · {subtitle}
        </p>
        <p className="mt-1 text-4xl font-semibold">{formatCents(total)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{modeLabel}</p>
        <div className="mt-3 flex flex-col gap-1">
          <Comparison comparison={comparison} previousLabel={previousLabel} />
          <p className="text-sm text-muted-foreground">
            Promedio diario: <span className="text-foreground">{formatCents(average)}</span>
          </p>
        </div>
      </section>

      <Suspense fallback={null}>
        <HaircutReminderCard categories={categories} today={today} />
      </Suspense>

      {monthBudget && (
        <div className="mb-4">
          <AllowanceCard budget={monthBudget.amount} spent={monthSpent} month={thisMonth} today={today} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">Por categoría</h2>
          <CategoryBreakdown
            totals={totalsByCategory(currentExpenses, mode)}
            categories={categories}
            grandTotal={total}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">{period === "semana" ? "Por día de la semana" : "Por día del mes"}</h2>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Sin gastos en este período.</p>
          ) : (
            <DayBars data={bars} />
          )}
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-sm font-medium">Últimos gastos</h2>
          <Link href="/gastos" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4">
            Ver todos
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Todavía no cargaste gastos. Tocá el botón + para agregar el primero.
          </p>
        ) : (
          <ExpenseList expenses={latest} today={today} />
        )}
      </section>
    </>
  );
}
