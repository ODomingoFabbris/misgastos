"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createRecurring, deleteRecurring, updateRecurring } from "@/app/actions/recurring";
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
import { halfShare } from "@/lib/expenses";
import { centsToInputValue, formatCents, parsePesosToCents } from "@/lib/money";
import { recurringToFormValues } from "@/lib/rows";
import { cn } from "@/lib/utils";
import { recurringSchema, type RecurringValues } from "@/lib/validators/recurring";
import type { Category, RecurringItem } from "@/types/database";

type Props = { items: RecurringItem[]; categories: Category[] };

export function RecurringManager({ items, categories }: Props) {
  // "new" = crear; RecurringItem = editar; null = cerrado.
  const [editing, setEditing] = useState<RecurringItem | "new" | null>(null);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <>
      <Button onClick={() => setEditing("new")} className="mb-4 h-11 w-full gap-2">
        <Plus className="size-4" aria-hidden />
        Nuevo gasto fijo
      </Button>

      {items.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Todavía no cargaste gastos fijos. Agregá el alquiler, el gimnasio o las suscripciones y se
          cargan solos cada mes.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {items.map((item) => {
            const category = categoryById.get(item.category_id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface",
                    !item.active && "opacity-60",
                  )}
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: category?.color ?? "#8a8a8a" }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{item.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Día {item.day_of_month} · {category?.name ?? "Sin categoría"}
                      {item.is_shared ? " · Compartido" : ""}
                      {item.active ? "" : " · Pausado"}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-medium">{formatCents(item.my_share)}</span>
                    {item.is_shared && (
                      <span className="block text-xs text-muted-foreground">de {formatCents(item.amount)}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl md:mx-auto md:max-w-lg">
          {editing !== null && (
            <RecurringForm
              key={editing === "new" ? "new" : editing.id}
              item={editing === "new" ? null : editing}
              categories={categories}
              onDone={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function RecurringForm({
  item,
  categories,
  onDone,
}: {
  item: RecurringItem | null;
  categories: Category[];
  onDone: () => void;
}) {
  const isEditing = item !== null;
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectable = categories.filter((c) => !c.is_archived || c.id === item?.category_id);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RecurringValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: item
      ? recurringToFormValues(item)
      : { name: "", amount: "", categoryId: "", dayOfMonth: 1, isShared: false, myShare: "", active: true },
  });

  const [categoryId, isShared, active, amount] = useWatch({
    control,
    name: ["categoryId", "isShared", "active", "amount"],
  });

  const totalCents = parsePesosToCents(amount);
  const halfPlaceholder = totalCents ? centsToInputValue(halfShare(totalCents)) : "";

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = item ? await updateRecurring(item.id, values) : await createRecurring(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success(isEditing ? "Gasto fijo actualizado" : "Gasto fijo creado");
      onDone();
    });
  });

  const onDelete = () => {
    if (!item) return;
    startTransition(async () => {
      const result = await deleteRecurring(item.id);
      setConfirmDelete(false);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success("Gasto fijo borrado");
      onDone();
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEditing ? "Editar gasto fijo" : "Nuevo gasto fijo"}</SheetTitle>
        <SheetDescription>
          Se carga solo una vez por mes, el día elegido. Los meses que ya pasaron no se completan.
        </SheetDescription>
      </SheetHeader>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="recurring-name">Nombre</Label>
          <Input
            id="recurring-name"
            autoComplete="off"
            maxLength={60}
            autoFocus
            className="h-11"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="recurring-amount">Monto</Label>
          <Input
            id="recurring-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
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
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} aria-hidden />
                  <span className="truncate">{category.name}</span>
                </button>
              );
            })}
          </div>
          {errors.categoryId && <p className="text-sm text-destructive">Elegí una categoría.</p>}
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="recurring-day">Día del mes (1 a 28)</Label>
          <Input
            id="recurring-day"
            type="number"
            inputMode="numeric"
            min={1}
            max={28}
            className="h-11"
            aria-invalid={Boolean(errors.dayOfMonth)}
            {...register("dayOfMonth", { valueAsNumber: true })}
          />
          {errors.dayOfMonth && <p className="text-sm text-destructive">{errors.dayOfMonth.message}</p>}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Label htmlFor="recurring-shared" className="flex-1 text-sm">
              Compartido con mi hermano
            </Label>
            <Switch
              id="recurring-shared"
              checked={isShared}
              onCheckedChange={(checked) => setValue("isShared", checked, { shouldValidate: true })}
            />
          </div>
          {isShared && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="recurring-share">Mi parte</Label>
              <Input
                id="recurring-share"
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
                <p className="text-xs text-muted-foreground">Si lo dejás vacío se toma la mitad.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
          <Label htmlFor="recurring-active" className="flex-1 text-sm">
            Activo (se genera cada mes)
          </Label>
          <Switch
            id="recurring-active"
            checked={active}
            onCheckedChange={(checked) => setValue("active", checked)}
          />
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isPending} className="h-12 w-full text-base">
            {isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear gasto fijo"}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
              className="h-11 w-full"
            >
              Borrar gasto fijo
            </Button>
          )}
        </div>
      </form>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar este gasto fijo?</AlertDialogTitle>
            <AlertDialogDescription>
              Deja de generarse. Los gastos que ya se cargaron no se borran.
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
