import { z } from "zod";
import { isValidDate } from "@/lib/dates";
import { parsePesosToCents } from "@/lib/money";

export const INCOME_SOURCES = ["familia", "freelance", "otro"] as const;

export const INCOME_SOURCE_LABELS: Record<(typeof INCOME_SOURCES)[number], string> = {
  familia: "Familia",
  freelance: "Freelance",
  otro: "Otro",
};

export const incomeSchema = z.object({
  source: z.enum(INCOME_SOURCES, { error: "Elegí de dónde viene." }),
  amount: z.string().refine((value) => {
    const cents = parsePesosToCents(value);
    return cents !== null && cents > 0;
  }, "Ingresá un monto mayor a cero."),
  receivedOn: z.string().refine(isValidDate, "Elegí una fecha válida."),
  client: z.string().trim().max(80, "El cliente no puede superar los 80 caracteres."),
  note: z.string().trim().max(200, "La nota no puede superar los 200 caracteres."),
});

export type IncomeValues = z.infer<typeof incomeSchema>;
