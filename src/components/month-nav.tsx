import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatMonthLabel, monthRange, previousMonthRange } from "@/lib/dates";
import { buildHref } from "@/lib/periods";

/** Flechas para ir al mes anterior/siguiente. No se puede avanzar más allá del mes actual. */
export function MonthNav({ basePath, monthDate, today }: { basePath: string; monthDate: string; today: string }) {
  const month = monthRange(monthDate);
  const currentMonthStart = monthRange(today).start;
  const previousStart = previousMonthRange(monthDate).start;
  const nextStart = addDays(month.end, 1);
  const canGoNext = nextStart <= currentMonthStart;

  // El mes actual es el valor por defecto: no hace falta ponerlo en la URL.
  const hrefFor = (start: string) =>
    buildHref(basePath, { mes: start === currentMonthStart ? undefined : start.slice(0, 7) });

  const arrow = "flex size-11 items-center justify-center rounded-lg border border-border bg-card";

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <Link href={hrefFor(previousStart)} aria-label="Mes anterior" className={arrow}>
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <h2 className="text-lg font-medium">{formatMonthLabel(month.start)}</h2>
      {canGoNext ? (
        <Link href={hrefFor(nextStart)} aria-label="Mes siguiente" className={arrow}>
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      ) : (
        <span className="size-11" aria-hidden />
      )}
    </div>
  );
}
