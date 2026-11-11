"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createExpense, deleteExpense, updateExpense } from "@/app/actions/expenses";
import { useExpenseSheet } from "@/components/expense-sheet-context";
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
import { Switch } from "@/components/ui/switch";
import { expenseToFormValues, halfShare } from "@/lib/expenses";
import { centsToInputValue, formatCents, parsePesosToCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { expenseSchema, type ExpenseValues } from "@/lib/validators/expense";
import type { Category, Expense } from "@/types/database";

type Props = {
  categories: Category[];
  /** Hoy en Córdoba, calculado en el servidor. */
  today: string;
};

export function ExpenseSheet({ categories, today }: Props) {
  const { open, expense, session, setOpen } = useExpenseSheet();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl md:mx-auto md:max-w-lg"
      >
        {/* key: formulario nuevo en cada apertura, con los valores correctos. */}
        <ExpenseForm
          key={session}
          expense={expense}
          categories={categories}
          today={today}
          onDone={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function ExpenseForm({
  expense,
  categories,
  today,
  onDone,
}: Props & { expense: Expense | null; onDone: () => void }) {
  const isEditing = expense !== null;
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Las archivadas no se ofrecen para gastos nuevos, salvo la que ya tiene este gasto.
  const selectable = categories.filter((c) => !c.is_archived || c.id === expense?.category_id);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? expenseToFormValues(expense)
      : { amount: "", categoryId: "", spentOn: today, note: "", isShared: false, myShare: "" },
  });

  const [categoryId, isShared, amount] = useWatch({
    control,
    name: ["categoryId", "isShared", "amount"],
  });

  const totalCents = parsePesosToCents(amount);
  const halfPlaceholder = totalCents ? centsToInputValue(halfShare(totalCents)) : "";

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = expense ? await updateExpense(expense.id, values) : await createExpense(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success(isEditing ? "Gasto actualizado" : "Gasto guardado");
      onDone();
    });
  });

  const onDelete = () => {
    if (!expense) return;
    startTransition(async () => {
      const result = await deleteExpense(expense.id);
      setConfirmDelete(false);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success("Gasto borrado");
      onDone();
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEditing ? "Editar gasto" : "Agregar gasto"}</SheetTitle>
        <SheetDescription className="sr-only">
          Completá el monto y la categoría. La fecha es hoy por defecto.
        </SheetDescription>
      </SheetHeader>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-amount">Monto</Label>
          <Input
            id="expense-amount"
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

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Categoría</legend>
          <div className="grid grid-cols-2 gap-2">
            {selectable.map((category) => {
              const selected = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setValue("categoryId", category.id, { shouldValidate: true })}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors",
                    selected ? "border-foreground bg-surface" : "border-border bg-card",
                  )}
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden
                  />
                  <span className="truncate">{category.name}</span>
                </button>
              );
            })}
          </div>
          {errors.categoryId && <p className="text-sm text-destructive">Elegí una categoría.</p>}
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-date">Fecha</Label>
          <Input
            id="expense-date"
            type="date"
            className="h-11"
            aria-invalid={Boolean(errors.spentOn)}
            {...register("spentOn")}
          />
          {errors.spentOn && <p className="text-sm text-destructive">{errors.spentOn.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-note">Nota (opcional)</Label>
          <Input
            id="expense-note"
            autoComplete="off"
            maxLength={200}
            className="h-11"
            aria-invalid={Boolean(errors.note)}
            {...register("note")}
          />
          {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Label htmlFor="expense-shared" className="flex-1 text-sm">
              Compartido con mi hermano
            </Label>
            <Switch
              id="expense-shared"
              checked={isShared}
              onCheckedChange={(checked) => setValue("isShared", checked, { shouldValidate: true })}
            />
          </div>

          {isShared && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-share">Mi parte</Label>
              <Input
                id="expense-share"
                inputMode="decimal"
                autoComplete="off"
                placeholder={halfPlaceholder || "La mitad"}
                className="h-11"
                aria-invalid={Boolean(errors.myShare)}
                {...register("myShare")}
              />
              {errors.myShare ? (
                <p className="text-sm text-destructive">{errors.myShare.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Si lo dejás vacío se toma la mitad
                  {totalCents ? ` (${formatCents(halfShare(totalCents))})` : ""}.
                </p>
              )}
            </div>
          )}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isPending} className="h-12 w-full text-base">
            {isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Guardar gasto"}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
              className="h-11 w-full"
            >
              Borrar gasto
            </Button>
          )}
        </div>
      </form>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar este gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se elimina de forma definitiva y deja de contar en tus totales.
            </AlertDialogDescription>
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
