"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Error inesperado en una pantalla privada. No muestra detalles técnicos al usuario. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6 text-center">
      <h1 className="text-lg font-semibold">Algo salió mal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No pudimos cargar esta pantalla. Revisá tu conexión y volvé a intentar.
      </p>
      <Button onClick={() => retry()} className="mt-4 h-11 w-full">
        Reintentar
      </Button>
    </section>
  );
}
