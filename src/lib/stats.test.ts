import { describe, expect, it } from "vitest";
import {
  comparePeriods,
  dailyAverage,
  filterByRange,
  sumExpenses,
  totalsByCategory,
  totalsByDay,
  weekSummaries,
  type ExpenseAmounts,
} from "./stats";

function expense(spent_on: string, my_share: number, category_id = "a", amount_total = my_share): ExpenseAmounts {
  return { spent_on, my_share, category_id, amount_total };
}

describe("sumExpenses", () => {
  const list = [expense("2026-11-02", 5000, "a", 10000), expense("2026-11-03", 3000)];

  it("suma my_share por defecto (mi parte)", () => {
    expect(sumExpenses(list, "share")).toBe(8000);
  });

  it("suma amount_total en modo 'lo que pagué'", () => {
    expect(sumExpenses(list, "paid")).toBe(13000);
  });

  it("lista vacía suma cero", () => {
    expect(sumExpenses([], "share")).toBe(0);
  });
});

describe("filterByRange", () => {
  it("incluye ambos extremos", () => {
    const list = [expense("2026-11-01", 1), expense("2026-11-07", 2), expense("2026-11-08", 4)];
    const result = filterByRange(list, { start: "2026-11-01", end: "2026-11-07" });
    expect(result.map((e) => e.my_share)).toEqual([1, 2]);
  });
});

describe("totalsByCategory", () => {
  it("ordena de mayor a menor y agrupa", () => {
    const list = [expense("2026-11-02", 100, "a"), expense("2026-11-03", 500, "b"), expense("2026-11-04", 250, "a")];
    expect(totalsByCategory(list, "share")).toEqual([
      { categoryId: "b", total: 500 },
      { categoryId: "a", total: 350 },
    ]);
  });

  it("respeta el modo", () => {
    const list = [expense("2026-11-02", 100, "a", 200), expense("2026-11-03", 150, "b", 150)];
    expect(totalsByCategory(list, "share")[0].categoryId).toBe("b");
    expect(totalsByCategory(list, "paid")[0].categoryId).toBe("a");
  });
});

describe("totalsByDay", () => {
  it("devuelve todos los días del rango, con ceros", () => {
    const list = [expense("2026-11-09", 100), expense("2026-11-09", 50), expense("2026-11-11", 70)];
    const days = totalsByDay(list, { start: "2026-11-09", end: "2026-11-15" }, "share");
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ date: "2026-11-09", total: 150 });
    expect(days[1]).toEqual({ date: "2026-11-10", total: 0 });
    expect(days[2]).toEqual({ date: "2026-11-11", total: 70 });
    expect(days[6].date).toBe("2026-11-15");
  });
});

describe("comparePeriods", () => {
  it("sube", () => {
    expect(comparePeriods(15000, 10000)).toEqual({ diff: 5000, percent: 50, direction: "up" });
  });

  it("baja", () => {
    expect(comparePeriods(5000, 10000)).toEqual({ diff: -5000, percent: -50, direction: "down" });
  });

  it("igual", () => {
    expect(comparePeriods(100, 100)).toEqual({ diff: 0, percent: 0, direction: "same" });
  });

  it("sin período anterior no hay porcentaje", () => {
    expect(comparePeriods(100, 0)).toEqual({ diff: 100, percent: null, direction: "up" });
    expect(comparePeriods(0, 0).direction).toBe("same");
  });
});

describe("dailyAverage", () => {
  const week = { start: "2026-11-09", end: "2026-11-15" };

  it("período en curso: divide por los días transcurridos", () => {
    // Miércoles = 3er día de la semana.
    expect(dailyAverage(3000, week, "2026-11-11")).toBe(1000);
  });

  it("el primer día cuenta como un día", () => {
    expect(dailyAverage(500, week, "2026-11-09")).toBe(500);
  });

  it("período cerrado: divide por todos sus días", () => {
    expect(dailyAverage(7000, week, "2026-11-30")).toBe(1000);
  });

  it("el último día del período usa todos los días", () => {
    expect(dailyAverage(7000, week, "2026-11-15")).toBe(1000);
  });

  it("período futuro: cero", () => {
    expect(dailyAverage(0, week, "2026-11-01")).toBe(0);
  });

  it("devuelve centavos enteros", () => {
    expect(Number.isInteger(dailyAverage(1000, week, "2026-11-11"))).toBe(true);
  });
});

describe("weekSummaries", () => {
  it("una fila por semana con total y categoría principal", () => {
    const list = [
      expense("2026-10-01", 100, "a"),
      expense("2026-10-05", 300, "b"),
      expense("2026-10-06", 50, "a"),
      expense("2026-10-31", 70, "b"),
    ];
    const rows = weekSummaries(list, "2026-10-15", "share");

    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ start: "2026-10-01", end: "2026-10-04", total: 100, topCategoryId: "a" });
    expect(rows[1]).toMatchObject({ start: "2026-10-05", end: "2026-10-11", total: 350, topCategoryId: "b" });
    expect(rows[2]).toMatchObject({ total: 0, topCategoryId: null });
    expect(rows[4]).toMatchObject({ start: "2026-10-26", end: "2026-10-31", total: 70, topCategoryId: "b" });
  });

  it("la suma de las semanas es el total del mes", () => {
    const list = [expense("2026-10-01", 100), expense("2026-10-04", 200), expense("2026-10-05", 300), expense("2026-10-31", 400)];
    const rows = weekSummaries(list, "2026-10-15", "share");
    expect(rows.reduce((sum, row) => sum + row.total, 0)).toBe(1000);
  });
});
