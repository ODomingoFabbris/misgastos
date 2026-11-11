import { BudgetBar } from "@/components/budget-bar";
import { budgetStatus, dailyAllowance } from "@/lib/budget";
import type { DateRange } from "@/lib/dates";
import { formatCents } from "@/lib/money";

/** Estado del tope total del mes y "cuánto puedo gastar por día". */
export function AllowanceCard({
  budget,
  spent,
  month,
  today,
}: {
  budget: number;
  spent: number;
  month: DateRange;
  today: string;
}) {
  const status = budgetStatus(spent, budget);
  const allowance = dailyAllowance(budget, spent, month, today);
  const isOver = month.end < today;

  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-label="Presupuesto del mes">
      <p className="text-sm text-muted-foreground">Presupuesto del mes</p>
      <p className="mt-1 text-sm">
        <span className="text-xl font-semibold">{formatCents(spent)}</span>
        <span className="text-muted-foreground"> de {formatCents(budget)}</span>
      </p>
      <BudgetBar status={status} label="Presupuesto total del mes" className="mt-3" />

      <p className={status.exceeded ? "mt-3 text-sm text-destructive" : "mt-3 text-sm text-muted-foreground"}>
        {status.exceeded
          ? `Te pasaste del tope por ${formatCents(-status.remaining)}.`
          : `Quedan ${formatCents(status.remaining)}.`}
      </p>

      {!isOver && !status.exceeded && allowance.daysLeft > 0 && (
        <p className="mt-2 text-sm">
          Podés gastar <span className="font-semibold">{formatCents(allowance.perDay)}</span> por día
          <span className="text-muted-foreground">
            {" "}
            ({allowance.daysLeft} {allowance.daysLeft === 1 ? "día" : "días"} restantes)
          </span>
        </p>
      )}
    </section>
  );
}
