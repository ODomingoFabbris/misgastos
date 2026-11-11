import { diffInDays } from "@/lib/dates";

/** Recordatorio de peluquería: el corte es cada 2 o 3 semanas. */
export const HAIRCUT_SOON_DAYS = 14;
export const HAIRCUT_OVERDUE_DAYS = 21;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * La categoría de peluquería se reconoce por el nombre ("Peluquería" de las
 * iniciales; si la renombrás con otra palabra, el recordatorio no la encuentra).
 */
export function findHaircutCategory<T extends { name: string }>(categories: T[]): T | undefined {
  return categories.find((category) => normalize(category.name).includes("peluquer"));
}

export type HaircutReminder = {
  /** Días desde el último corte. */
  days: number;
  /** "soon": ya pasaron 2 semanas. "overdue": ya pasaron 3. */
  level: "soon" | "overdue";
};

export function haircutReminder(lastCutOn: string | null, today: string): HaircutReminder | null {
  if (!lastCutOn) return null;
  const days = diffInDays(lastCutOn, today);
  if (days >= HAIRCUT_OVERDUE_DAYS) return { days, level: "overdue" };
  if (days >= HAIRCUT_SOON_DAYS) return { days, level: "soon" };
  return null;
}
