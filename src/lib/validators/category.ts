import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre.")
    .max(40, "El nombre no puede superar los 40 caracteres."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Elegí un color válido."),
});

export type CategoryValues = z.infer<typeof categorySchema>;

export const idSchema = z.uuid({ error: "Identificador inválido." });
