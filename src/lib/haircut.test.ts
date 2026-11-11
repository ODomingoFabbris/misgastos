import { describe, expect, it } from "vitest";
import { findHaircutCategory, haircutReminder } from "./haircut";

describe("findHaircutCategory", () => {
  it("la encuentra sin importar tildes ni mayúsculas", () => {
    const categories = [{ name: "Comida" }, { name: "Peluquería" }];
    expect(findHaircutCategory(categories)).toEqual({ name: "Peluquería" });
    expect(findHaircutCategory([{ name: "PELUQUERIA" }])).toEqual({ name: "PELUQUERIA" });
  });

  it("devuelve undefined si no existe", () => {
    expect(findHaircutCategory([{ name: "Comida" }])).toBeUndefined();
  });
});

describe("haircutReminder", () => {
  const today = "2026-11-30";

  it("antes de las 2 semanas no avisa", () => {
    expect(haircutReminder("2026-11-17", today)).toBeNull(); // 13 días
  });

  it("a las 2 semanas avisa 'soon'", () => {
    expect(haircutReminder("2026-11-16", today)).toEqual({ days: 14, level: "soon" });
    expect(haircutReminder("2026-11-10", today)).toEqual({ days: 20, level: "soon" });
  });

  it("a las 3 semanas o más avisa 'overdue'", () => {
    expect(haircutReminder("2026-11-09", today)).toEqual({ days: 21, level: "overdue" });
    expect(haircutReminder("2026-09-01", today)?.level).toBe("overdue");
  });

  it("sin cortes registrados no avisa", () => {
    expect(haircutReminder(null, today)).toBeNull();
  });
});
