"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  moveCategory,
  moveExpensesAndDeleteCategory,
  setCategoryArchived,
  updateCategory,
} from "@/app/actions/categories";
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
import { cn } from "@/lib/utils";
import { categorySchema, type CategoryValues } from "@/lib/validators/category";
import type { Category } from "@/types/database";

/** Colores apagados, distintos del rojo y el verde que usa la app para gasto e ingreso. */
const COLOR_PRESETS = [
  "#E0A458",
  "#D98E73",
  "#5B8DB8",
  "#A66FB5",
  "#6FB7B0",
  "#C77DA3",
  "#7C83D9",
  "#B8A17A",
  "#8FA3AD",
  "#9A9A9A",
  "#6C7A89",
  "#4F9DA6",
  "#D6C36A",
  "#B07A5B",
  "#8C6FD0",
];

type Props = {
  categories: Category[];
  expenseCounts: Record<string, number>;
};

export function CategoryManager({ categories, expenseCounts }: Props) {
  // "new" = crear; Category = editar; null = cerrado.
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  const onMove = (id: string, direction: "up" | "down") => {
    startTransition(async () => {
      const result = await moveCategory(id, direction);
      if (!result.ok) toast.error(result.error);
    });
  };

  return (
    <>
      <Button onClick={() => setEditing("new")} className="mb-4 h-11 w-full gap-2">
        <Plus className="size-4" aria-hidden />
        Nueva categoría
      </Button>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {categories.map((category, index) => (
          <li key={category.id} className="flex min-h-14 items-center gap-2 px-3 py-2">
            <span
              className="size-4 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm", category.is_archived && "text-muted-foreground")}>
                {category.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {category.is_archived ? "Archivada · " : ""}
                {expenseCounts[category.id] ?? 0} gastos
              </p>
            </div>
            <Button
              variant="ghost"
              className="size-11"
              disabled={isPending || index === 0}
              onClick={() => onMove(category.id, "up")}
              aria-label={`Subir ${category.name}`}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="size-11"
              disabled={isPending || index === categories.length - 1}
              onClick={() => onMove(category.id, "down")}
              aria-label={`Bajar ${category.name}`}
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="size-11"
              onClick={() => setEditing(category)}
              aria-label={`Editar ${category.name}`}
            >
              <Pencil className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl md:mx-auto md:max-w-lg">
          {editing !== null && (
            <CategoryForm
              key={editing === "new" ? "new" : editing.id}
              category={editing === "new" ? null : editing}
              categories={categories}
              expenseCount={editing === "new" ? 0 : (expenseCounts[editing.id] ?? 0)}
              onDone={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

type FormProps = {
  category: Category | null;
  categories: Category[];
  expenseCount: number;
  onDone: () => void;
};

function CategoryForm({ category, categories, expenseCount, onDone }: FormProps) {
  const isEditing = category !== null;
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? "", color: category?.color ?? COLOR_PRESETS[0] },
  });

  const color = useWatch({ control, name: "color" });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = category ? await updateCategory(category.id, values) : await createCategory(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success(isEditing ? "Categoría actualizada" : "Categoría creada");
      onDone();
    });
  });

  const onToggleArchived = () => {
    if (!category) return;
    startTransition(async () => {
      const result = await setCategoryArchived(category.id, !category.is_archived);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      toast.success(category.is_archived ? "Categoría restaurada" : "Categoría archivada");
      onDone();
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEditing ? "Editar categoría" : "Nueva categoría"}</SheetTitle>
        <SheetDescription className="sr-only">Nombre y color de la categoría.</SheetDescription>
      </SheetHeader>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="category-name">Nombre</Label>
          <Input
            id="category-name"
            autoComplete="off"
            maxLength={40}
            autoFocus
            className="h-11"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Color</legend>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={`Color ${preset}`}
                aria-pressed={color.toLowerCase() === preset.toLowerCase()}
                onClick={() => setValue("color", preset, { shouldValidate: true })}
                className={cn(
                  "size-11 rounded-full border-2",
                  color.toLowerCase() === preset.toLowerCase() ? "border-foreground" : "border-transparent",
                )}
                style={{ backgroundColor: preset }}
              />
            ))}
            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm">
              Otro
              <input
                type="color"
                value={color}
                onChange={(event) => setValue("color", event.target.value, { shouldValidate: true })}
                className="size-7 cursor-pointer border-0 bg-transparent p-0"
                aria-label="Elegir otro color"
              />
            </label>
          </div>
          {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
        </fieldset>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isPending} className="h-12 w-full text-base">
            {isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear categoría"}
          </Button>
          {isEditing && (
            <>
              <Button type="button" variant="outline" disabled={isPending} onClick={onToggleArchived} className="h-11 w-full">
                {category.is_archived ? "Restaurar categoría" : "Archivar categoría"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => setConfirmDelete(true)}
                className="h-11 w-full"
              >
                Borrar categoría
              </Button>
            </>
          )}
        </div>
      </form>

      {category && (
        <DeleteCategoryDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          category={category}
          others={categories.filter((c) => c.id !== category.id && !c.is_archived)}
          knownExpenseCount={expenseCount}
          onDone={onDone}
        />
      )}
    </>
  );
}

type DeleteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  others: Category[];
  knownExpenseCount: number;
  onDone: () => void;
};

/**
 * Confirma el borrado. Si la categoría tiene gastos, ofrece moverlos a otra
 * categoría (y borrar) o archivarla, que conserva el historial.
 */
function DeleteCategoryDialog({ open, onOpenChange, category, others, knownExpenseCount, onDone }: DeleteProps) {
  const [isPending, startTransition] = useTransition();
  const [expenseCount, setExpenseCount] = useState(knownExpenseCount);
  const [targetId, setTargetId] = useState(others[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const hasExpenses = expenseCount > 0;

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setExpenseCount(knownExpenseCount);
      setError(null);
    }
    onOpenChange(next);
  };

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.ok) {
        toast.success("Categoría borrada");
        onOpenChange(false);
        onDone();
        return;
      }
      if (result.code === "has_expenses") {
        setExpenseCount(result.expenseCount ?? 1);
        setError(null);
        return;
      }
      setError(result.error);
    });
  };

  const onMoveAndDelete = () => {
    startTransition(async () => {
      const result = await moveExpensesAndDeleteCategory(category.id, targetId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Gastos movidos y categoría borrada");
      onOpenChange(false);
      onDone();
    });
  };

  const onArchive = () => {
    startTransition(async () => {
      const result = await setCategoryArchived(category.id, true);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Categoría archivada");
      onOpenChange(false);
      onDone();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasExpenses
              ? `Tiene ${expenseCount} ${expenseCount === 1 ? "gasto" : "gastos"}. Podés moverlos a otra categoría y borrarla, o archivarla para conservar el historial.`
              : "Se elimina de forma definitiva, junto con sus presupuestos."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasExpenses && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="move-target">Mover los gastos a</Label>
            <select
              id="move-target"
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {others.map((other) => (
                <option key={other.id} value={other.id}>
                  {other.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
          {hasExpenses ? (
            <>
              <Button variant="outline" className="h-11" disabled={isPending} onClick={onArchive}>
                Archivar
              </Button>
              <Button variant="destructive" className="h-11" disabled={isPending || !targetId} onClick={onMoveAndDelete}>
                Mover y borrar
              </Button>
            </>
          ) : (
            <Button variant="destructive" className="h-11" disabled={isPending} onClick={onDelete}>
              Borrar
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
