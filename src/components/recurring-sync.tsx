"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { syncRecurringExpenses } from "@/app/actions/recurring";

/**
 * Al abrir la app genera los gastos fijos del mes que ya vencieron. La función de la
 * base es idempotente, así que repetir la llamada (otra pestaña, recarga) no duplica nada.
 */
export function RecurringSync() {
  useEffect(() => {
    syncRecurringExpenses()
      .then(({ created }) => {
        if (created > 0) {
          toast.success(created === 1 ? "Se cargó 1 gasto fijo" : `Se cargaron ${created} gastos fijos`);
        }
      })
      .catch(() => {
        // Es una tarea de fondo: si falla (sin conexión), se reintenta la próxima vez.
      });
  }, []);

  return null;
}
