import { PiggyBank, Repeat, Tags, Users, Wallet, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Secciones secundarias: en celular se llega desde "Más", en escritorio van en el menú lateral. */
export const MORE_ITEMS: NavItem[] = [
  { href: "/presupuesto", label: "Presupuesto", icon: PiggyBank },
  { href: "/ingresos", label: "Ingresos", icon: Wallet },
  { href: "/fijos", label: "Gastos fijos", icon: Repeat },
  { href: "/hermano", label: "Saldo con mi hermano", icon: Users },
  { href: "/categorias", label: "Categorías", icon: Tags },
];
