import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Comparison } from "@/components/comparison";
import { PageHeader } from "@/components/page-header";
import { SegmentedLinks } from "@/components/segmented-links";
import { addDays, formatMonthLabel, formatRange, monthRange, previousMonthRange, todayInCordoba } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { buildHref, parseAmountMode, parseMonthParam } from "@/lib/periods";
import { getCategories } from "@/lib/queries/categories";
import { getExpenseAmounts } from "@/lib/queries/expenses";
import { comparePeriods, dailyAverage, filterByRange, sumExpenses, weekSummaries } from "@/lib/stats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Resumen" };

export default async function ResumenPage({ searchParams }: PageProps<"/resumen">) {
  const params = await searchParams;
  const mode = parseAmountMode(params.ver);

  const today = todayInCordoba();
  const monthDate = parseMonthParam(params.mes, monthRange(today).start);
  const month = monthRange(monthDate);
  const previous = previousMonthRange(monthDate);
  const currentMonthStart = monthRange(today).start;

  const [amounts, categories] = await Promise.all([
    getExpenseAmounts({ start: previous.start, end: month.end }),
    getCategories(),
  ]);

  const monthExpenses = filterByRange(amounts, month);
  const total = sumExpenses(monthExpenses, mode);
  const previousTotal = sumExpenses(filterByRange(amounts, previous), mode);
  const weeks = weekSummaries(monthExpenses, monthDate, mode);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  // Navegación entre meses: no se puede avanzar más allá del mes actual.
  const prevMonthParam = previous.start.slice(0, 7);
  const nextMonthStart = addDays(month.end, 1);
  const canGoNext = nextMonthStart <= currentMonthStart;
  const modeParam = mode === "paid" ? "pague" : undefined;
  const monthParam = month.start === currentMonthStart ? undefined : month.start.slice(0, 7);

  return (
    <>
      <PageHeader title="Resumen" description="Cuánto gastás cada semana y en el mes." />

      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href={buildHref("/resumen", { mes: prevMonthParam, ver: modeParam })}
          aria-label="Mes anterior"
          className="flex size-11 items-center justify-center rounded-lg border border-border bg-card"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h2 className="text-lg font-medium">{formatMonthLabel(month.start)}</h2>
        {canGoNext ? (
          <Link
            href={buildHref("/resumen", {
              mes: nextMonthStart === currentMonthStart ? undefined : nextMonthStart.slice(0, 7),
              ver: modeParam,
            })}
            aria-label="Mes siguiente"
            className="flex size-11 items-center justify-center rounded-lg border border-border bg-card"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        ) : (
          <span className="size-11" aria-hidden />
        )}
      </div>

      <div className="mb-6">
        <SegmentedLinks
          label="Qué monto ver"
          options={[
            { label: "Mi parte", href: buildHref("/resumen", { mes: monthParam }), active: mode === "share" },
            { label: "Lo que pagué", href: buildHref("/resumen", { mes: monthParam, ver: "pague" }), active: mode === "paid" },
          ]}
        />
      </div>

      <section className="mb-6 rounded-xl border border-border bg-card p-4" aria-label="Total del mes">
        <p className="text-sm text-muted-foreground">Total del mes · {mode === "paid" ? "Lo que pagué" : "Mi parte"}</p>
        <p className="mt-1 text-4xl font-semibold">{formatCents(total)}</p>
        <div className="mt-3 flex flex-col gap-1">
          <Comparison comparison={comparePeriods(total, previousTotal)} previousLabel="el mes anterior" />
          <p className="text-sm text-muted-foreground">
            Promedio diario: <span className="text-foreground">{formatCents(dailyAverage(total, month, today))}</span>
          </p>
        </div>
      </section>

      <section aria-label="Semana a semana">
        <h2 className="mb-2 px-1 text-sm font-medium">Semana a semana</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {weeks.map((week) => {
            const isCurrent = today >= week.start && today <= week.end;
            const isFuture = week.start > today;
            const top = week.topCategoryId ? categoryById.get(week.topCategoryId) : undefined;
            return (
              <li
                key={week.start}
                aria-current={isCurrent ? "date" : undefined}
                className={cn("flex min-h-14 items-center gap-3 px-3 py-2", isCurrent && "bg-surface")}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {formatRange(week)}
                    {isCurrent && <span className="ml-2 text-xs text-muted-foreground">Esta semana</span>}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {top ? (
                      <>
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: top.color }} aria-hidden />
                        <span className="truncate">{top.name}</span>
                      </>
                    ) : (
                      <span>{isFuture ? "Todavía no llegó" : "Sin gastos"}</span>
                    )}
                  </p>
                </div>
                <p className={cn("text-sm font-medium", isFuture && "text-muted-foreground")}>
                  {isFuture ? "—" : formatCents(week.total)}
                </p>
              </li>
            );
          })}
          <li className="flex min-h-14 items-center justify-between gap-3 bg-surface px-3 py-2">
            <p className="text-sm font-medium">Total del mes</p>
            <p className="text-sm font-semibold">{formatCents(total)}</p>
          </li>
        </ul>
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          Las semanas van de lunes a domingo; la primera y la última se recortan al mes.
        </p>
      </section>
    </>
  );
}
