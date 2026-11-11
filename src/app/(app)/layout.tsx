import { Suspense } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNav, SideNav } from "@/components/app-nav";
import { ExpenseSheetHost } from "@/components/expense-sheet-host";
import { ExpenseSheetProvider } from "@/components/expense-sheet-context";
import { LogoutButton } from "@/components/logout-button";
import { RecurringSync } from "@/components/recurring-sync";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ExpenseSheetProvider>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <div className="min-h-dvh">
        <SideNav footer={<LogoutButton />} />
        <main id="contenido" className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:ml-60 md:max-w-none md:px-8 md:pb-10">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
            <AuthGuard>{children}</AuthGuard>
          </Suspense>
        </main>
        <BottomNav />
      </div>
      <Suspense>
        <ExpenseSheetHost />
      </Suspense>
      <RecurringSync />
      <Toaster position="top-center" />
    </ExpenseSheetProvider>
  );
}
