"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Menu, Plus, Receipt, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/resumen", label: "Resumen", icon: BarChart3 },
  { href: "/mas", label: "Más", icon: Menu },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Botón central "+". La hoja de agregar gasto llega en el Paso 2. */
function AddExpenseButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label="Agregar gasto (disponible pronto)"
      title="Agregar gasto (disponible pronto)"
      className={cn(
        "flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-60",
        className,
      )}
    >
      <Plus className="size-6" aria-hidden />
    </button>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [inicio, gastos, resumen, mas] = ITEMS;

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-center">
        {[inicio, gastos].map((item) => (
          <BottomNavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        <li className="flex justify-center">
          <AddExpenseButton className="-mt-4" />
        </li>
        {[resumen, mas].map((item) => (
          <BottomNavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </ul>
    </nav>
  );
}

function BottomNavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
        {item.label}
      </Link>
    </li>
  );
}

export function SideNav({ footer }: { footer?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card p-4 md:flex">
      <p className="mb-6 px-3 text-lg font-semibold">Mis gastos</p>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm",
                active ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        <div className="mt-2 flex items-center gap-3 px-3 text-sm text-muted-foreground">
          <AddExpenseButton className="size-10" />
          Agregar gasto
        </div>
      </nav>
      {footer}
    </aside>
  );
}
