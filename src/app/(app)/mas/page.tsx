import { PageHeader } from "@/components/page-header";
import { LogoutButton } from "@/components/logout-button";
import { requireUser } from "@/lib/auth";

export default async function MasPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Más" />
      <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Sesión iniciada como</p>
        <p className="mt-1 break-all font-medium">{user.email}</p>
      </section>
      <LogoutButton />
    </>
  );
}
