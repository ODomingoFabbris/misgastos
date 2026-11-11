import { z } from "zod";
import { isValidDate } from "@/lib/dates";
import { parsePesosToCents } from "@/lib/money";

/**
 * Mismo esquema en el formulario y en la Server Action. Los montos viajan como
 * texto en formato argentino y se convierten a centavos con `toExpenseRow`.
 */
export const expenseSchema = z
  .object({
    amount: z.string().refine((value) => {
      const cents = parsePesosToCents(value);
      return cents !== null && cents > 0;
    }, "Ingresá un monto mayor a cero."),
    categoryId: z.uuid({ error: "Elegí una categoría." }),
    spentOn: z.string().refine(isValidDate, "Elegí una fecha válida."),
    note: z.string().trim().max(200, "La nota no puede superar los 200 caracteres."),
    isShared: z.boolean(),
    /** Solo si es compartido. Vacío = la mitad. */
    myShare: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.isShared) return;

    const total = parsePesosToCents(values.amount);
    const typed = values.myShare.trim();
    const share = typed === "" ? null : parsePesosToCents(typed);

    if (typed !== "" && share === null) {
      ctx.addIssue({ code: "custom", path: ["myShare"], message: "Ingresá un monto válido." });
    } else if (share !== null && total !== null && share > total) {
      ctx.addIssue({
        code: "custom",
        path: ["myShare"],
        message: "Tu parte no puede ser mayor al total.",
      });
    }
  });

export type ExpenseValues = z.infer<typeof expenseSchema>;
