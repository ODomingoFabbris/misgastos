import type { Metadata } from "next";
import { ExpenseList } from "@/components/expense-list";
import { PageHeader } from "@/components/page-header";
import { SettleControls } from "@/components/settle-controls";
import { todayInCordoba } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { getExpenses } from "@/lib/queries/expenses";
import { getBrotherBalance } from "@/lib/queries/settlements";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Saldo con mi hermano" };

export default async function HermanoPage() {
  const [{ owed, settled, balance, settlements }, recentShared] = await Promise.all([
    getBrotherBalance(),
    getExpenses({ sharedOnly: true }, 10),
  ]);
  const today = todayInCordoba();

  const headline = balance > 0 ? "Tu hermano te debe" : balance < 0 ? "Le debés a tu hermano" : "Están a mano";

  return (
    <>
      <PageHeader
        title="Saldo con mi hermano"
        description="Lo que pagaste de más en los gastos compartidos, menos lo que ya te devolvió."
      />

      <section className="mb-4 rounded-xl border border-border bg-card p-4" aria-label="Saldo">
        <p className="text-sm text-muted-foreground">{headline}</p>
        {balance !== 0 && (
          <p className={cn("mt-1 text-4xl font-semibold", balance > 0 ? "text-success" : "text-destructive")}>
            {formatCents(Math.abs(balance))}
          </p>
        )}
        {balance < 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Pasa si se saldó de más o si se borró un gasto compartido después de saldar.
          </p>
        )}
        <dl className="mt-4 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Puesto por él en total</dt>
            <dd>{formatCents(owed)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Ya devuelto</dt>
            <dd>{formatCents(settled)}</dd>
          </div>
        </dl>
      </section>

      <SettleControls balance={balance} settlements={settlements} today={today} />

      <section className="mt-6" aria-label="Últimos gastos compartidos">
        <h2 className="mb-2 px-1 text-sm font-medium">Últimos gastos compartidos</h2>
        {recentShared.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            No hay gastos compartidos todavía. Marcá “Compartido con mi hermano” al cargar un gasto.
          </p>
        ) : (
          <ExpenseList expenses={recentShared} today={today} />
        )}
      </section>
    </>
  );
}
