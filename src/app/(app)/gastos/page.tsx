import type { Metadata } from "next";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { buildHref } from "@/lib/periods";
import { ExpenseFilters } from "@/components/expense-filters";
import { ExpenseList } from "@/components/expense-list";
import { PageHeader } from "@/components/page-header";
import { todayInCordoba } from "@/lib/dates";
import { getCategories } from "@/lib/queries/categories";
import { EXPENSES_PAGE_LIMIT, getExpenses, type ExpenseFilters as Filters } from "@/lib/queries/expenses";
import { idSchema } from "@/lib/validators/category";

export const metadata: Metadata = { title: "Gastos" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GastosPage({ searchParams }: PageProps<"/gastos">) {
  const params = await searchParams;
  const category = first(params.categoria);

  const filters: Filters = {
    q: first(params.q),
    categoryId: category && idSchema.safeParse(category).success ? category : undefined,
    from: first(params.desde),
    to: first(params.hasta),
  };

  const [expenses, categories] = await Promise.all([getExpenses(filters), getCategories()]);
  const today = todayInCordoba();
  const isFiltered = Boolean(filters.q || filters.categoryId || filters.from || filters.to);

  return (
    <>
      <PageHeader title="Gastos" />
      <ExpenseFilters categories={categories} filters={filters} />

      {expenses.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {isFiltered
            ? "No hay gastos que coincidan con los filtros."
            : "Todavía no cargaste gastos. Tocá el botón + para agregar el primero."}
        </p>
      ) : (
        <ExpenseList expenses={expenses} today={today} />
      )}

      {expenses.length > 0 && (
        <div className="mt-6">
          {/* Es una descarga, no una página: se usa <a> y no <Link>. */}
          <a
            href={buildHref("/gastos/export", {
              q: filters.q,
              categoria: filters.categoryId,
              desde: filters.from,
              hasta: filters.to,
            })}
            download
            className={buttonVariants({ variant: "outline", className: "h-11 w-full gap-2" })}
          >
            <Download className="size-4" aria-hidden />
            {isFiltered ? "Exportar estos gastos a CSV" : "Exportar todos los gastos a CSV"}
          </a>
        </div>
      )}

      {expenses.length === EXPENSES_PAGE_LIMIT && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Se muestran los {EXPENSES_PAGE_LIMIT} gastos más recientes. Usá los filtros para acotar.
        </p>
      )}
    </>
  );
}
