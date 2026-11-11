import { describe, expect, it } from "vitest";
import {
  addDays,
  daysInRange,
  dayOfMonth,
  diffInDays,
  formatDayLabel,
  formatMonthLabel,
  formatRange,
  formatWeekdayInitial,
  isValidDate,
  monthRange,
  previousMonthRange,
  previousWeekRange,
  startOfWeek,
  todayInCordoba,
  weekRange,
  weeksOfMonth,
} from "./dates";

describe("todayInCordoba", () => {
  it("usa la zona de Córdoba (UTC-3), no la del servidor", () => {
    // 02:00 UTC del 1/1 todavía es 31/12 a las 23:00 en Córdoba.
    expect(todayInCordoba(new Date("2026-01-01T02:00:00Z"))).toBe("2025-12-31");
    expect(todayInCordoba(new Date("2026-01-01T03:00:00Z"))).toBe("2026-01-01");
  });

  it("devuelve formato yyyy-MM-dd", () => {
    expect(todayInCordoba(new Date("2026-03-05T15:00:00Z"))).toBe("2026-03-05");
  });
});

describe("semana lunes a domingo", () => {
  it("un miércoles pertenece a la semana que empieza el lunes anterior", () => {
    expect(weekRange("2026-11-11")).toEqual({ start: "2026-11-09", end: "2026-11-15" });
  });

  it("el domingo cierra la semana y el lunes abre la siguiente", () => {
    expect(weekRange("2026-11-15")).toEqual({ start: "2026-11-09", end: "2026-11-15" });
    expect(weekRange("2026-11-16")).toEqual({ start: "2026-11-16", end: "2026-11-22" });
  });

  it("el lunes es el inicio de su propia semana", () => {
    expect(startOfWeek("2026-11-09")).toBe("2026-11-09");
  });

  it("cambio de mes a mitad de semana", () => {
    // 1/10/2026 es jueves: la semana arranca en septiembre.
    expect(weekRange("2026-10-01")).toEqual({ start: "2026-09-28", end: "2026-10-04" });
  });

  it("fin de año a mitad de semana", () => {
    // 31/12/2025 es miércoles.
    expect(weekRange("2025-12-31")).toEqual({ start: "2025-12-29", end: "2026-01-04" });
  });

  it("semana anterior", () => {
    expect(previousWeekRange("2026-11-11")).toEqual({ start: "2026-11-02", end: "2026-11-08" });
    expect(previousWeekRange("2026-01-02")).toEqual({ start: "2025-12-22", end: "2025-12-28" });
  });
});

describe("mes", () => {
  it("rango de un mes de 30 y de 31 días", () => {
    expect(monthRange("2026-11-10")).toEqual({ start: "2026-11-01", end: "2026-11-30" });
    expect(monthRange("2026-12-31")).toEqual({ start: "2026-12-01", end: "2026-12-31" });
  });

  it("febrero común y bisiesto", () => {
    expect(monthRange("2026-02-10").end).toBe("2026-02-28");
    expect(monthRange("2028-02-10").end).toBe("2028-02-29");
  });

  it("mes anterior cruzando el año", () => {
    expect(previousMonthRange("2026-01-15")).toEqual({ start: "2025-12-01", end: "2025-12-31" });
    expect(previousMonthRange("2026-03-31")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });
});

describe("weeksOfMonth", () => {
  it("recorta las semanas de los extremos al mes", () => {
    const weeks = weeksOfMonth("2026-10-15");
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual({
      start: "2026-10-01",
      end: "2026-10-04",
      weekStart: "2026-09-28",
      weekEnd: "2026-10-04",
    });
    expect(weeks[4]).toEqual({
      start: "2026-10-26",
      end: "2026-10-31",
      weekStart: "2026-10-26",
      weekEnd: "2026-11-01",
    });
  });

  it("las semanas cubren el mes completo sin solaparse", () => {
    for (const date of ["2026-02-10", "2026-10-15", "2026-12-01", "2028-02-29"]) {
      const weeks = weeksOfMonth(date);
      const month = monthRange(date);
      expect(weeks[0].start).toBe(month.start);
      expect(weeks[weeks.length - 1].end).toBe(month.end);
      for (let i = 1; i < weeks.length; i++) {
        expect(weeks[i].start).toBe(addDays(weeks[i - 1].end, 1));
      }
      const total = weeks.reduce((sum, week) => sum + daysInRange(week), 0);
      expect(total).toBe(daysInRange(month));
    }
  });

  it("un mes que empieza lunes tiene la primera semana completa", () => {
    // 1/6/2026 es lunes.
    const [first] = weeksOfMonth("2026-06-10");
    expect(first.start).toBe("2026-06-01");
    expect(first.weekStart).toBe("2026-06-01");
  });
});

describe("formatDayLabel / isValidDate", () => {
  it("usa Hoy y Ayer", () => {
    expect(formatDayLabel("2026-11-11", "2026-11-11")).toBe("Hoy");
    expect(formatDayLabel("2026-11-10", "2026-11-11")).toBe("Ayer");
  });

  it("muestra el día de la semana en español", () => {
    expect(formatDayLabel("2026-11-05", "2026-11-11")).toBe("Jueves, 5 de noviembre");
  });

  it("agrega el año si no es el actual", () => {
    expect(formatDayLabel("2025-12-31", "2026-01-02")).toContain("2025");
  });

  it("valida fechas calendario", () => {
    expect(isValidDate("2028-02-29")).toBe(true);
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("11/11/2026")).toBe(false);
  });
});

describe("formatos de período", () => {
  it("formatRange", () => {
    expect(formatRange({ start: "2026-11-09", end: "2026-11-15" })).toBe("9 nov – 15 nov");
    expect(formatRange({ start: "2026-11-09", end: "2026-11-09" })).toBe("9 nov");
  });

  it("formatMonthLabel", () => {
    expect(formatMonthLabel("2026-11-10")).toBe("Noviembre 2026");
  });

  it("formatWeekdayInitial y dayOfMonth", () => {
    expect(formatWeekdayInitial("2026-11-09")).toBe("L"); // lunes
    expect(formatWeekdayInitial("2026-11-15")).toBe("D"); // domingo
    expect(dayOfMonth("2026-11-05")).toBe("5");
    expect(dayOfMonth("2026-11-25")).toBe("25");
  });
});

describe("addDays / diffInDays", () => {
  it("suma días cruzando mes y año", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("diferencia de días", () => {
    expect(diffInDays("2026-11-01", "2026-11-30")).toBe(29);
    expect(daysInRange({ start: "2026-11-01", end: "2026-11-30" })).toBe(30);
  });

  it("rechaza fechas inválidas", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow();
    expect(() => addDays("hoy", 1)).toThrow();
  });
});
