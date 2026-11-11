"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createIncome, deleteIncome, updateIncome } from "@/app/actions/incomes";
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
import { formatDayLabel } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { incomeToFormValues } from "@/lib/rows";
import { cn } from "@/lib/utils";
import {
  INCOME_SOURCES,
  INCOME_SOURCE_LABELS,
  incomeSchema,
  type IncomeValues,
} from "@/lib/validators/income";
import type { Income } from "@/types/database";

export function IncomeManager({ incomes, today }: { incomes: Income[]; today: string }) {
  // "new" = crear; Income = editar; null = cerrado.
  const [editing, setEditing] = useState<Income | "new" | null>(null);

  return (
    <>
      <Button onClick={() => setEditing("new")} className="mb-4 h-11 w-full gap-2">
        <Plus className="size-4" aria-hidden />
        Nuevo ingreso
      </Button>

      {incomes.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          No hay ingresos en este mes.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {incomes.map((income) => (
            <li key={income.id}>
              <button
                type="button"
                onClick={() => setEditing(income)}
                className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    {INCOME_SOURCE_LABELS[income.source]}
                    {income.client ? ` · ${income.client}` : ""}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatDayLabel(income.received_on, today)}
                    {income.note ? ` · ${income.note}` : ""}
                  </span>
                </span>
                <span className="text-sm font-medium text-success">{formatCents(income.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl md:mx-auto md:max-w-lg">
          {editing !== null && (
            <IncomeForm
              key={editing === "new" ? "new" : editing.id}
              income={editing === "new" ? null : editing}
              today={today}
              onDone={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function IncomeForm({ income, today, onDone }: { income: Income | null; today: string; onDone: () => void }) {
  const isEditing = income !== null;
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<IncomeValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: income
      ? incomeToFormValues(income)
      : { source: "familia", amount: "", receivedOn: today, client: "", note: "" },
  });

  const source = useWatch({ control, name: "source" });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = income ? await updateIncome(income.id, values) : await createIncome(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success(isEditing ? "Ingreso actualizado" : "Ingreso guardado");
      onDone();
    });
  });

  const onDelete = () => {
    if (!income) return;
    startTransition(async () => {
      const result = await deleteIncome(income.id);
      setConfirmDelete(false);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success("Ingreso borrado");
      onDone();
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEditing ? "Editar ingreso" : "Nuevo ingreso"}</SheetTitle>
        <SheetDescription className="sr-only">Origen, monto y fecha del ingreso.</SheetDescription>
      </SheetHeader>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 px-4 pb-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Origen</legend>
          <div className="grid grid-cols-3 gap-2">
            {INCOME_SOURCES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={source === option}
                onClick={() => setValue("source", option, { shouldValidate: true })}
                className={cn(
                  "min-h-11 rounded-lg border px-3 text-sm transition-colors",
                  source === option ? "border-foreground bg-surface" : "border-border bg-card",
                )}
              >
                {INCOME_SOURCE_LABELS[option]}
              </button>
            ))}
          </div>
          {errors.source && <p className="text-sm text-destructive">{errors.source.message}</p>}
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="income-amount">Monto</Label>
          <Input
            id="income-amount"
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="income-date">Fecha</Label>
          <Input
            id="income-date"
            type="date"
            className="h-11"
            aria-invalid={Boolean(errors.receivedOn)}
            {...register("receivedOn")}
          />
          {errors.receivedOn && <p className="text-sm text-destructive">{errors.receivedOn.message}</p>}
        </div>

        {source === "freelance" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="income-client">Cliente (opcional)</Label>
            <Input
              id="income-client"
              autoComplete="off"
              maxLength={80}
              className="h-11"
              aria-invalid={Boolean(errors.client)}
              {...register("client")}
            />
            {errors.client && <p className="text-sm text-destructive">{errors.client.message}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="income-note">Nota (opcional)</Label>
          <Input
            id="income-note"
            autoComplete="off"
            maxLength={200}
            className="h-11"
            aria-invalid={Boolean(errors.note)}
            {...register("note")}
          />
          {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isPending} className="h-12 w-full text-base">
            {isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Guardar ingreso"}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
              className="h-11 w-full"
            >
              Borrar ingreso
            </Button>
          )}
        </div>
      </form>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar este ingreso?</AlertDialogTitle>
            <AlertDialogDescription>Se elimina de forma definitiva y deja de contar en el balance.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <Button variant="destructive" className="h-11" disabled={isPending} onClick={onDelete}>
              Borrar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
