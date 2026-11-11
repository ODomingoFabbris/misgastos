/** Resultado común de las Server Actions de mutación. */
export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      /** Permite a la interfaz ofrecer un camino alternativo (ej. mover gastos al borrar). */
      code?: "has_expenses";
      expenseCount?: number;
    };

type DbError = { code?: string; message: string };

/** Traduce errores de Postgres/Supabase a mensajes en español. */
export function translateDbError(
  error: DbError,
  { duplicate = "Ya existe un registro igual." }: { duplicate?: string } = {},
): string {
  switch (error.code) {
    case "23505":
      return duplicate;
    case "23503":
      return "No se puede completar porque hay datos relacionados.";
    case "23514":
      return "Los datos no cumplen las reglas de la base. Revisá los montos.";
    case "42501":
      return "No tenés permiso para hacer esto.";
    default:
      return "Ocurrió un error inesperado. Probá de nuevo.";
  }
}
