import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { RecurringManager } from "@/components/recurring-manager";
import { formatCents } from "@/lib/money";
import { getCategories } from "@/lib/queries/categories";
import { getRecurringItems } from "@/lib/queries/recurring";

export const metadata: Metadata = { title: "Gastos fijos" };

export default async function FijosPage() {
  const [items, categories] = await Promise.all([getRecurringItems(), getCategories()]);
  const monthlyTotal = items.filter((item) => item.active).reduce((sum, item) => sum + item.my_share, 0);

  return (
    <>
      <PageHeader title="Gastos fijos" description="Alquiler, gimnasio, suscripciones: se cargan solos una vez por mes." />

      {items.some((item) => item.active) && (
        <section className="mb-4 rounded-xl border border-border bg-card p-4" aria-label="Total mensual de gastos fijos">
          <p className="text-sm text-muted-foreground">Fijos por mes (tu parte)</p>
          <p className="mt-1 text-3xl font-semibold">{formatCents(monthlyTotal)}</p>
        </section>
      )}

      <RecurringManager items={items} categories={categories} />
    </>
  );
}
