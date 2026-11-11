"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteSettlement, settleBalance } from "@/app/actions/settlements";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatDayLabel } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import type { Settlement } from "@/types/database";

/** Botón "Saldar" (con confirmación) y el historial de lo saldado, con opción de deshacer. */
export function SettleControls({
  balance,
  settlements,
  today,
}: {
  balance: number;
  settlements: Settlement[];
  today: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmSettle, setConfirmSettle] = useState(false);
  const [toUndo, setToUndo] = useState<Settlement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSettle = () => {
    startTransition(async () => {
      const result = await settleBalance();
      setConfirmSettle(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      toast.success("Saldo saldado");
    });
  };

  const onUndo = () => {
    if (!toUndo) return;
    startTransition(async () => {
      const result = await deleteSettlement(toUndo.id);
      setToUndo(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      toast.success("Se deshizo el saldo saldado");
    });
  };

  return (
    <>
      <Button
        disabled={isPending || balance <= 0}
        onClick={() => setConfirmSettle(true)}
        className="mb-6 h-12 w-full text-base"
      >
        Saldar
      </Button>

      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <section aria-label="Saldos saldados">
        <h2 className="mb-2 px-1 text-sm font-medium">Ya saldado</h2>
        {settlements.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Todavía no saldaron nada.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {settlements.map((settlement) => (
              <li key={settlement.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 text-sm">{formatDayLabel(settlement.settled_on, today)}</span>
                <span className="text-sm font-medium text-success">{formatCents(settlement.amount)}</span>
                <Button variant="ghost" className="h-11" disabled={isPending} onClick={() => setToUndo(settlement)}>
                  Deshacer
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog open={confirmSettle} onOpenChange={setConfirmSettle}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Saldar {formatCents(balance)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Registra que tu hermano te devolvió todo lo que te debía hasta hoy. Si te equivocás, podés deshacerlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <Button className="h-11" disabled={isPending} onClick={onSettle}>
              Saldar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={toUndo !== null} onOpenChange={(open) => !open && setToUndo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deshacer este saldo?</AlertDialogTitle>
            <AlertDialogDescription>
              {toUndo ? `Los ${formatCents(toUndo.amount)} vuelven a figurar como pendientes.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <Button variant="destructive" className="h-11" disabled={isPending} onClick={onUndo}>
              Deshacer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
