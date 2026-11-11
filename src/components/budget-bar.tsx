import { cn } from "@/lib/utils";
import type { BudgetStatus } from "@/lib/budget";

/** Barra verde que pasa a roja al exceder el presupuesto (CLAUDE.md > Diseño). */
export function BudgetBar({ status, label, className }: { status: BudgetStatus; label: string; className?: string }) {
  const width = Math.min(status.percent, 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(status.percent, 100)}
      aria-valuetext={status.exceeded ? `Excedido, ${status.percent}% del presupuesto` : `${status.percent}% del presupuesto`}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface", className)}
    >
      <div
        className={cn("h-full rounded-full", status.exceeded ? "bg-destructive" : "bg-success")}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
