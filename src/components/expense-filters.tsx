import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExpenseFilters as Filters } from "@/lib/queries/expenses";
import type { Category } from "@/types/database";

const selectClassName =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Filtros por URL (?q, categoria, desde, hasta): se pueden compartir y sobreviven al recargar. */
export function ExpenseFilters({ categories, filters }: { categories: Category[]; filters: Filters }) {
  const hasAdvanced = Boolean(filters.categoryId || filters.from || filters.to);
  const hasAny = hasAdvanced || Boolean(filters.q);

  return (
    <Form action="/gastos" className="mb-6 flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          name="q"
          type="search"
          defaultValue={filters.q ?? ""}
          placeholder="Buscar en las notas"
          aria-label="Buscar en las notas"
          className="h-11 pl-9"
        />
      </div>

      <details open={hasAdvanced} className="group rounded-lg border border-border bg-card">
        <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm text-muted-foreground">
          Más filtros
        </summary>
        <div className="grid grid-cols-2 gap-3 px-3 pb-3">
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="filter-category">Categoría</Label>
            <select
              id="filter-category"
              name="categoria"
              defaultValue={filters.categoryId ?? ""}
              className={selectClassName}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.is_archived ? " (archivada)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-from">Desde</Label>
            <Input id="filter-from" name="desde" type="date" defaultValue={filters.from ?? ""} className="h-11" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-to">Hasta</Label>
            <Input id="filter-to" name="hasta" type="date" defaultValue={filters.to ?? ""} className="h-11" />
          </div>
        </div>
      </details>

      <div className="flex gap-2">
        <Button type="submit" className="h-11 flex-1">
          Filtrar
        </Button>
        {hasAny && (
          <Link href="/gastos" className={buttonVariants({ variant: "outline", className: "h-11 px-4" })}>
            Limpiar
          </Link>
        )}
      </div>
    </Form>
  );
}
