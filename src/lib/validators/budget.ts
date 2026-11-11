import { z } from "zod";
import { isValidDate } from "@/lib/dates";
import { parsePesosToCents } from "@/lib/money";

/** categoryId vacío = tope total del mes. `month` es "yyyy-MM". */
export const budgetSchema = z.object({
  categoryId: z.union([z.literal(""), z.uuid({ error: "Categoría inválida." })]),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Mes inválido.")
    .refine((month) => isValidDate(`${month}-01`), "Mes inválido."),
  amount: z.string().refine((value) => {
    const cents = parsePesosToCents(value);
    return cents !== null && cents > 0;
  }, "Ingresá un monto mayor a cero."),
});

export type BudgetValues = z.infer<typeof budgetSchema>;
