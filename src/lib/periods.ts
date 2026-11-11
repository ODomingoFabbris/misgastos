import { isValidDate } from "@/lib/dates";
import type { AmountMode } from "@/lib/stats";

/** Lectura de parámetros de URL (?periodo, ?ver, ?mes). Valores raros caen al valor por defecto. */

export type Period = "semana" | "mes";

type Param = string | string[] | undefined;

function first(value: Param) {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePeriod(value: Param): Period {
  return first(value) === "mes" ? "mes" : "semana";
}

/** "pague" = lo que pagué (amount_total); cualquier otra cosa = mi parte (my_share). */
export function parseAmountMode(value: Param): AmountMode {
  return first(value) === "pague" ? "paid" : "share";
}

/** "2026-10" -> "2026-10-01". Si no es válido, devuelve `fallbackDate`. */
export function parseMonthParam(value: Param, fallbackDate: string): string {
  const month = first(value);
  if (month && /^\d{4}-\d{2}$/.test(month) && isValidDate(`${month}-01`)) return `${month}-01`;
  return fallbackDate;
}

/** Arma una URL conservando solo los parámetros que tienen valor. */
export function buildHref(path: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
