import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <section className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">No encontramos esta página</h1>
        <p className="mt-2 text-sm text-muted-foreground">Puede que el enlace esté mal escrito o que ya no exista.</p>
        <Link href="/" className={buttonVariants({ className: "mt-4 h-11 w-full" })}>
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}
