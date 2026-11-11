/**
 * Dinero siempre en centavos enteros. Nunca decimales flotantes.
 * El usuario escribe pesos en formato argentino (12.500,50) y se guarda en centavos.
 */

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

const MAX_CENTS = Number.MAX_SAFE_INTEGER;

/**
 * Convierte lo que escribe el usuario (formato es-AR) a centavos enteros.
 * El punto es separador de miles y la coma es el decimal: "12.500,50" -> 1250050.
 * Devuelve null si el texto no es un monto válido (vacío, letras, más de 2 decimales).
 */
export function parsePesosToCents(input: string): number | null {
  const text = input.trim().replace(/^\$\s*/, "");
  if (text === "") return null;

  // Entero con miles opcionales ("12.500" o "12500") y hasta 2 decimales tras la coma.
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(text);
  if (!match) return null;

  const whole = match[1].replace(/\./g, "");
  const decimals = (match[2] ?? "").padEnd(2, "0");
  const cents = Number(whole) * 100 + Number(decimals);

  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null;
}

/** Formato visual argentino: 1250050 -> "$ 12.500,50". */
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/**
 * Texto para precargar un campo de monto al editar: 1250050 -> "12500,50".
 * Sin separador de miles y sin decimales si son ",00".
 */
export function centsToInputValue(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.trunc(abs / 100);
  const decimals = abs % 100;
  if (decimals === 0) return `${sign}${whole}`;
  return `${sign}${whole},${String(decimals).padStart(2, "0")}`;
}
