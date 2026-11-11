import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MORE_ITEMS } from "@/components/nav-items";
import { PageHeader } from "@/components/page-header";
import { LogoutButton } from "@/components/logout-button";
import { requireUser } from "@/lib/auth";

export default async function MasPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Más" />
      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Sesión iniciada como</p>
        <p className="mt-1 break-all font-medium">{user.email}</p>
      </section>
      <ul className="mb-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {MORE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link href={item.href} className="flex min-h-14 items-center gap-3 px-4">
                <Icon className="size-5 text-muted-foreground" aria-hidden />
                <span className="flex-1 text-sm">{item.label}</span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
      <LogoutButton />
    </>
  );
}
