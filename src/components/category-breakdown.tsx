import { CategoryPie, type PieSlice } from "@/components/charts";
import { formatCents } from "@/lib/money";
import type { CategoryTotal } from "@/lib/stats";
import type { Category } from "@/types/database";

const FALLBACK_COLOR = "#8a8a8a";

/** Torta por categoría + lista con monto y porcentaje (la lista es la versión accesible). */
export function CategoryBreakdown({
  totals,
  categories,
  grandTotal,
}: {
  totals: CategoryTotal[];
  categories: Category[];
  grandTotal: number;
}) {
  if (totals.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin gastos en este período.</p>;
  }

  const byId = new Map(categories.map((category) => [category.id, category]));
  const rows = totals.map((item) => {
    const category = byId.get(item.categoryId);
    return {
      id: item.categoryId,
      name: category?.name ?? "Sin categoría",
      fill: category?.color ?? FALLBACK_COLOR,
      total: item.total,
      percent: grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0,
    };
  });
  const slices: PieSlice[] = rows.map(({ name, total, fill }) => ({ name, total, fill }));

  return (
    <div className="flex flex-col gap-4">
      <CategoryPie data={slices} />
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.id} className="flex min-h-9 items-center gap-3 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: row.fill }} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{row.name}</span>
            <span className="text-muted-foreground">{row.percent}%</span>
            <span className="w-28 text-right font-medium">{formatCents(row.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
