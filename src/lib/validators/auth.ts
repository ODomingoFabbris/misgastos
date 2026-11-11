import { z } from "zod";

/** Mismos esquemas en el formulario (cliente) y en las Server Actions. */

const email = z
  .string()
  .trim()
  .min(1, "Ingresá tu email.")
  .pipe(z.email({ error: "Ingresá un email válido." }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const signupSchema = z.object({
  email,
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña no puede superar los 72 caracteres."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;

/** Resultado de las acciones de autenticación. Si salen bien, redirigen. */
export type AuthActionResult = {
  error?: string;
  message?: string;
};
