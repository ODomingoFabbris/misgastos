import { z } from "zod";
import { parsePesosToCents } from "@/lib/money";

/** Gasto fijo mensual. El día va de 1 a 28 para que exista en todos los meses. */
export const recurringSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Ingresá un nombre.")
      .max(60, "El nombre no puede superar los 60 caracteres."),
    amount: z.string().refine((value) => {
      const cents = parsePesosToCents(value);
      return cents !== null && cents > 0;
    }, "Ingresá un monto mayor a cero."),
    categoryId: z.uuid({ error: "Elegí una categoría." }),
    dayOfMonth: z
      .number({ error: "Ingresá un día entre 1 y 28." })
      .int("Ingresá un día entre 1 y 28.")
      .min(1, "Ingresá un día entre 1 y 28.")
      .max(28, "Ingresá un día entre 1 y 28."),
    isShared: z.boolean(),
    /** Solo si es compartido. Vacío = la mitad. */
    myShare: z.string(),
    active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.isShared) return;

    const total = parsePesosToCents(values.amount);
    const typed = values.myShare.trim();
    const share = typed === "" ? null : parsePesosToCents(typed);

    if (typed !== "" && share === null) {
      ctx.addIssue({ code: "custom", path: ["myShare"], message: "Ingresá un monto válido." });
    } else if (share !== null && total !== null && share > total) {
      ctx.addIssue({ code: "custom", path: ["myShare"], message: "Tu parte no puede ser mayor al total." });
    }
  });

export type RecurringValues = z.infer<typeof recurringSchema>;
