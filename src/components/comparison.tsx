import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { Comparison as ComparisonData } from "@/lib/stats";
import { cn } from "@/lib/utils";

/** Rojo si el gasto subió, verde si bajó (CLAUDE.md > Diseño). */
export function Comparison({ comparison, previousLabel }: { comparison: ComparisonData; previousLabel: string }) {
  const { direction, diff, percent } = comparison;
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : ArrowRight;
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  const word = direction === "up" ? "Subió" : direction === "down" ? "Bajó" : "Igual";

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 text-sm",
        direction === "up" && "text-destructive",
        direction === "down" && "text-success",
        direction === "same" && "text-muted-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span>
        <span className="sr-only">{word}: </span>
        {sign}
        {formatCents(Math.abs(diff))}
        {percent !== null && direction !== "same" ? ` (${sign}${Math.abs(percent)}%)` : ""}
      </span>
      <span className="text-muted-foreground">vs {previousLabel}</span>
    </p>
  );
}
