import { describe, expect, it } from "vitest";
import { budgetStatus, dailyAllowance } from "./budget";

describe("budgetStatus", () => {
  it("dentro del presupuesto", () => {
    expect(budgetStatus(25000, 100000)).toEqual({
      spent: 25000,
      budget: 100000,
      remaining: 75000,
      percent: 25,
      exceeded: false,
    });
  });

  it("justo en el tope no se considera excedido", () => {
    const status = budgetStatus(100000, 100000);
    expect(status.exceeded).toBe(false);
    expect(status.percent).toBe(100);
    expect(status.remaining).toBe(0);
  });

  it("excedido: restante negativo y porcentaje sin tope", () => {
    const status = budgetStatus(120000, 100000);
    expect(status.exceeded).toBe(true);
    expect(status.remaining).toBe(-20000);
    expect(status.percent).toBe(120);
  });

  it("presupuesto en cero no divide por cero", () => {
    expect(budgetStatus(500, 0).percent).toBe(0);
  });
});

describe("dailyAllowance", () => {
  const november = { start: "2026-11-01", end: "2026-11-30" };

  it("divide lo que queda por los días restantes, contando hoy", () => {
    // Del 11 al 30 de noviembre son 20 días.
    expect(dailyAllowance(1000000, 200000, november, "2026-11-11")).toEqual({
      remaining: 800000,
      daysLeft: 20,
      perDay: 40000,
    });
  });

  it("el último día queda un solo día", () => {
    const result = dailyAllowance(100000, 40000, november, "2026-11-30");
    expect(result.daysLeft).toBe(1);
    expect(result.perDay).toBe(60000);
  });

  it("redondea hacia abajo y devuelve centavos enteros", () => {
    const result = dailyAllowance(100000, 0, november, "2026-11-01");
    expect(result.daysLeft).toBe(30);
    expect(result.perDay).toBe(3333);
  });

  it("si ya se pasó del tope: restante negativo y cero por día", () => {
    const result = dailyAllowance(100000, 130000, november, "2026-11-11");
    expect(result.remaining).toBe(-30000);
    expect(result.perDay).toBe(0);
  });

  it("mes ya terminado: cero días y cero por día", () => {
    const result = dailyAllowance(100000, 0, november, "2026-12-02");
    expect(result.daysLeft).toBe(0);
    expect(result.perDay).toBe(0);
  });

  it("mes futuro: cuenta todos sus días", () => {
    const result = dailyAllowance(300000, 0, november, "2026-10-20");
    expect(result.daysLeft).toBe(30);
    expect(result.perDay).toBe(10000);
  });
});
