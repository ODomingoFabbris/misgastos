"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, Tooltip, XAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatCents } from "@/lib/money";

export type PieSlice = { name: string; total: number; fill: string };
export type DayBar = { label: string; fullLabel: string; total: number };

type TooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: { name?: string; fullLabel?: string; total?: number } }>;
};

function MoneyTooltip({ active, payload }: TooltipProps) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground">{item.name ?? item.fullLabel}</p>
      <p className="font-medium text-foreground">{formatCents(item.total ?? 0)}</p>
    </div>
  );
}

const pieConfig = { total: { label: "Gasto" } } satisfies ChartConfig;
const barConfig = { total: { label: "Gasto", color: "#8a8a8a" } } satisfies ChartConfig;

/** Torta por categoría. El detalle accesible va en la lista que la acompaña. */
export function CategoryPie({ data }: { data: PieSlice[] }) {
  return (
    <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-56" aria-hidden>
      <PieChart>
        <Tooltip content={<MoneyTooltip />} />
        <Pie
          data={data}
          dataKey="total"
          nameKey="name"
          innerRadius="55%"
          outerRadius="90%"
          stroke="var(--card)"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </PieChart>
    </ChartContainer>
  );
}

/** Barras por día. */
export function DayBars({ data }: { data: DayBar[] }) {
  return (
    <ChartContainer config={barConfig} className="aspect-[16/10] w-full" role="img" aria-label="Gasto por día">
      <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={8} />
        <Tooltip content={<MoneyTooltip />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="total" fill="var(--color-total)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
