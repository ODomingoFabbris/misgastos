import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

/**
 * Fechas calendario (sin hora) como texto "yyyy-MM-dd", igual que las columnas `date` de la base.
 * "Hoy" se calcula siempre en la zona de Córdoba. La semana va de lunes a domingo.
 */

export const APP_TIME_ZONE = "America/Argentina/Cordoba";

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DateRange = {
  /** Primer día, inclusive. */
  start: string;
  /** Último día, inclusive. */
  end: string;
};

export type WeekOfMonth = DateRange & {
  /** Lunes de la semana completa (puede caer en el mes anterior). */
  weekStart: string;
  /** Domingo de la semana completa (puede caer en el mes siguiente). */
  weekEnd: string;
};

/** Fecha de hoy en Córdoba, sin importar la zona del servidor o del navegador. */
export function todayInCordoba(now: Date = new Date()): string {
  return format(new TZDate(now, APP_TIME_ZONE), "yyyy-MM-dd");
}

/** Usamos UTC solo como calendario puro: evita saltos por horario de verano. */
function toUtc(date: string): Date {
  const match = ISO_DATE.exec(date);
  if (!match) throw new Error(`Fecha inválida: "${date}"`);
  const [, year, month, day] = match;
  const utc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (toIso(utc) !== date) throw new Error(`Fecha inválida: "${date}"`);
  return utc;
}

function toIso(utc: Date): string {
  const year = String(utc.getUTCFullYear()).padStart(4, "0");
  const month = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number): string {
  return toIso(new Date(toUtc(date).getTime() + days * DAY_MS));
}

/** Cantidad de días entre dos fechas (to - from). */
export function diffInDays(from: string, to: string): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / DAY_MS);
}

/** Lunes de la semana que contiene a `date`. */
export function startOfWeek(date: string): string {
  const dayOfWeek = toUtc(date).getUTCDay(); // 0 = domingo
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return addDays(date, -daysSinceMonday);
}

/** Semana lunes a domingo que contiene a `date`. */
export function weekRange(date: string): DateRange {
  const start = startOfWeek(date);
  return { start, end: addDays(start, 6) };
}

/** Mes calendario que contiene a `date`. */
export function monthRange(date: string): DateRange {
  const utc = toUtc(date);
  const year = utc.getUTCFullYear();
  const month = utc.getUTCMonth();
  return {
    start: toIso(new Date(Date.UTC(year, month, 1))),
    end: toIso(new Date(Date.UTC(year, month + 1, 0))),
  };
}

/** Semana inmediatamente anterior (para comparar). */
export function previousWeekRange(date: string): DateRange {
  return weekRange(addDays(startOfWeek(date), -1));
}

/** Mes inmediatamente anterior (para comparar). */
export function previousMonthRange(date: string): DateRange {
  return monthRange(addDays(monthRange(date).start, -1));
}

/**
 * Filas de la tabla "semana a semana" de un mes. Cada semana se recorta a los
 * límites del mes, así la suma de las filas coincide con el total mensual.
 */
export function weeksOfMonth(date: string): WeekOfMonth[] {
  const month = monthRange(date);
  const weeks: WeekOfMonth[] = [];

  let weekStart = startOfWeek(month.start);
  while (weekStart <= month.end) {
    const weekEnd = addDays(weekStart, 6);
    weeks.push({
      start: weekStart < month.start ? month.start : weekStart,
      end: weekEnd > month.end ? month.end : weekEnd,
      weekStart,
      weekEnd,
    });
    weekStart = addDays(weekStart, 7);
  }

  return weeks;
}

/** Cantidad de días de un rango, ambos extremos incluidos. */
export function daysInRange(range: DateRange): number {
  return diffInDays(range.start, range.end) + 1;
}

/** Verdadero si el texto es una fecha calendario real con formato yyyy-MM-dd. */
export function isValidDate(date: string): boolean {
  try {
    toUtc(date);
    return true;
  } catch {
    return false;
  }
}

const dayLabelFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
const weekdayFormatter = new Intl.DateTimeFormat("es-AR", { weekday: "narrow", timeZone: "UTC" });

/** "9 nov – 15 nov". */
export function formatRange(range: DateRange): string {
  const clean = (date: string) => shortDateFormatter.format(toUtc(date)).replace(".", "");
  return range.start === range.end ? clean(range.start) : `${clean(range.start)} – ${clean(range.end)}`;
}

/** "Noviembre 2026". */
export function formatMonthLabel(date: string): string {
  const label = monthFormatter.format(toUtc(date)).replace(" de ", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Inicial del día de la semana ("L", "M", …). */
export function formatWeekdayInitial(date: string): string {
  return weekdayFormatter.format(toUtc(date)).toUpperCase();
}

/** Número de día del mes como texto. */
export function dayOfMonth(date: string): string {
  return String(Number(date.slice(8, 10)));
}

/** Título de un día en la lista: "Hoy", "Ayer" o "Miércoles, 11 de noviembre". */
export function formatDayLabel(date: string, today: string): string {
  if (date === today) return "Hoy";
  if (date === addDays(today, -1)) return "Ayer";
  const label = dayLabelFormatter.format(toUtc(date));
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
  const year = date.slice(0, 4);
  return year === today.slice(0, 4) ? capitalized : `${capitalized} de ${year}`;
}
