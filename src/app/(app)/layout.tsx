import { Suspense } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNav, SideNav } from "@/components/app-nav";
import { LogoutButton } from "@/components/logout-button";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh">
      <SideNav footer={<LogoutButton />} />
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:ml-60 md:max-w-none md:px-8 md:pb-10">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
          <AuthGuard>{children}</AuthGuard>
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
