import Link from "next/link";
import { cn } from "@/lib/utils";

export type SegmentOption = { label: string; href: string; active: boolean };

/** Selector de opciones excluyentes hecho con enlaces: el estado vive en la URL. */
export function SegmentedLinks({ options, label }: { options: SegmentOption[]; label: string }) {
  return (
    <nav aria-label={label} className="grid grid-flow-col auto-cols-fr rounded-lg border border-border bg-card p-1">
      {options.map((option) => (
        <Link
          key={option.label}
          href={option.href}
          aria-current={option.active ? "true" : undefined}
          className={cn(
            "flex min-h-11 items-center justify-center rounded-md px-3 text-sm",
            option.active ? "bg-surface font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
