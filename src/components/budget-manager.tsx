"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { deleteBudget, saveBudget } from "@/app/actions/budgets";
import { BudgetBar } from "@/components/budget-bar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { budgetStatus } from "@/lib/budget";
import { centsToInputValue, formatCents } from "@/lib/money";
import { budgetSchema, type BudgetValues } from "@/lib/validators/budget";

export type BudgetLine = {
  /** null = tope total del mes. */
  categoryId: string | null;
  name: string;
  color: string | null;
  spent: number;
  budgetId: string | null;
  budget: number | null;
};

/** Lista de presupuestos del mes (total y por categoría). Tocar una fila define o cambia el monto. */
export function BudgetManager({ month, lines }: { month: string; lines: BudgetLine[] }) {
  const [editing, setEditing] = useState<BudgetLine | null>(null);

  return (
    <>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {lines.map((line) => {
          const status = line.budget !== null ? budgetStatus(line.spent, line.budget) : null;
          return (
            <li key={line.categoryId ?? "total"}>
              <button
                type="button"
                onClick={() => setEditing(line)}
                className="flex min-h-14 w-full flex-col gap-2 px-3 py-3 text-left hover:bg-surface"
              >
                <span className="flex items-center gap-3">
                  {line.color ? (
                    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: line.color }} aria-hidden />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{line.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {status ? `${formatCents(status.spent)} de ${formatCents(status.budget)}` : "Definir"}
                  </span>
                </span>
                {status ? (
                  <>
                    <BudgetBar status={status} label={`Presupuesto de ${line.name}`} />
                    <span className={status.exceeded ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                      {status.exceeded
                        ? `Te pasaste por ${formatCents(-status.remaining)}`
                        : `Quedan ${formatCents(status.remaining)}`}
                    </span>
                  </>
                ) : line.spent > 0 ? (
                  <span className="text-xs text-muted-foreground">Sin presupuesto · gastado {formatCents(line.spent)}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl md:mx-auto md:max-w-lg">
          {editing && (
            <BudgetForm
              key={editing.categoryId ?? "total"}
              month={month}
              line={editing}
              onDone={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function BudgetForm({ month, line, onDone }: { month: string; line: BudgetLine; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: line.categoryId ?? "",
      month,
      amount: line.budget !== null ? centsToInputValue(line.budget) : "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await saveBudget(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success("Presupuesto guardado");
      onDone();
    });
  });

  const onDelete = () => {
    if (!line.budgetId) return;
    startTransition(async () => {
      const result = await deleteBudget(line.budgetId as string);
      setConfirmDelete(false);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success("Presupuesto quitado");
      onDone();
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{line.categoryId === null ? "Tope total del mes" : `Presupuesto: ${line.name}`}</SheetTitle>
        <SheetDescription>
          {line.categoryId === null
            ? "Cuánto querés gastar como máximo en el mes (tu parte)."
            : "Tope mensual para esta categoría (tu parte)."}
        </SheetDescription>
      </SheetHeader>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 px-4 pb-4">
        <input type="hidden" {...register("categoryId")} />
        <input type="hidden" {...register("month")} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="budget-amount">Monto</Label>
          <Input
            id="budget-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            autoFocus
            className="h-14 text-2xl font-semibold"
            aria-invalid={Boolean(errors.amount)}
            {...register("amount")}
          />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isPending} className="h-12 w-full text-base">
            {isPending ? "Guardando…" : "Guardar presupuesto"}
          </Button>
          {line.budgetId && (
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
              className="h-11 w-full"
            >
              Quitar presupuesto
            </Button>
          )}
        </div>
      </form>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar este presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Solo se elimina el tope de este mes. Tus gastos no se tocan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <Button variant="destructive" className="h-11" disabled={isPending} onClick={onDelete}>
              Quitar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
