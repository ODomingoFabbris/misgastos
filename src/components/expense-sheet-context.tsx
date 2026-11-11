"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Expense } from "@/types/database";

type ExpenseSheetState = {
  open: boolean;
  /** null = gasto nuevo. */
  expense: Expense | null;
  /** Cambia en cada apertura para reiniciar el formulario. */
  session: number;
};

type ExpenseSheetApi = ExpenseSheetState & {
  openNew: () => void;
  openEdit: (expense: Expense) => void;
  setOpen: (open: boolean) => void;
};

const ExpenseSheetContext = createContext<ExpenseSheetApi | null>(null);

/** Estado de la hoja. No lee datos: puede vivir en la parte estática del layout. */
export function ExpenseSheetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExpenseSheetState>({ open: false, expense: null, session: 0 });

  const openNew = useCallback(
    () => setState((prev) => ({ open: true, expense: null, session: prev.session + 1 })),
    [],
  );
  const openEdit = useCallback(
    (expense: Expense) => setState((prev) => ({ open: true, expense, session: prev.session + 1 })),
    [],
  );
  const setOpen = useCallback((open: boolean) => setState((prev) => ({ ...prev, open })), []);

  const value = useMemo(
    () => ({ ...state, openNew, openEdit, setOpen }),
    [state, openNew, openEdit, setOpen],
  );

  return <ExpenseSheetContext value={value}>{children}</ExpenseSheetContext>;
}

export function useExpenseSheet() {
  const context = useContext(ExpenseSheetContext);
  if (!context) throw new Error("useExpenseSheet debe usarse dentro de ExpenseSheetProvider.");
  return context;
}
