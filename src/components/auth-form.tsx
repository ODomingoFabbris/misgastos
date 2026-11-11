"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginSchema,
  signupSchema,
  type AuthActionResult,
  type SignupValues,
} from "@/lib/validators/auth";

type Mode = "login" | "signup";

const COPY = {
  login: {
    title: "Iniciar sesión",
    submit: "Ingresar",
    pending: "Ingresando…",
    switchText: "¿No tenés cuenta?",
    switchLink: "Crear cuenta",
    switchHref: "/registro",
    passwordAutoComplete: "current-password",
  },
  signup: {
    title: "Crear cuenta",
    submit: "Crear cuenta",
    pending: "Creando cuenta…",
    switchText: "¿Ya tenés cuenta?",
    switchLink: "Iniciar sesión",
    switchHref: "/login",
    passwordAutoComplete: "new-password",
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : signupSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setResult({});
    startTransition(async () => {
      // Si sale bien, la acción redirige y no vuelve acá.
      const response = mode === "login" ? await login(values) : await signup(values);
      if (response) setResult(response);
    });
  });

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold">{copy.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">Gestor de gastos personal</p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="h-11"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete={copy.passwordAutoComplete}
            className="h-11"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {result.error && (
          <p role="alert" className="text-sm text-destructive">
            {result.error}
          </p>
        )}
        {result.message && (
          <p role="status" className="text-sm text-success">
            {result.message}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="h-11 w-full">
          {isPending ? copy.pending : copy.submit}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {copy.switchText}{" "}
        <Link href={copy.switchHref} className="inline-flex min-h-11 items-center text-foreground underline underline-offset-4">
          {copy.switchLink}
        </Link>
      </p>
    </div>
  );
}
