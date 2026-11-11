import { describe, expect, it } from "vitest";
import { budgetSchema } from "@/lib/validators/budget";
import { incomeSchema, type IncomeValues } from "@/lib/validators/income";
import { recurringSchema } from "@/lib/validators/recurring";
import { toBudgetRow, toIncomeRow, toRecurringRow } from "./rows";

const CATEGORY = "3f1c2a52-6a0e-4f0a-9d53-1d2a8a1b7c11";

describe("budgetSchema / toBudgetRow", () => {
  it("categoría vacía = tope total (category_id nulo)", () => {
    const values = { categoryId: "", month: "2026-11", amount: "500.000" };
    expect(budgetSchema.safeParse(values).success).toBe(true);
    expect(toBudgetRow(values)).toEqual({ category_id: null, month: "2026-11-01", amount: 50000000 });
  });

  it("presupuesto por categoría", () => {
    const values = { categoryId: CATEGORY, month: "2026-11", amount: "80.000,50" };
    expect(toBudgetRow(values)).toEqual({ category_id: CATEGORY, month: "2026-11-01", amount: 8000050 });
  });

  it("rechaza datos inválidos", () => {
    expect(budgetSchema.safeParse({ categoryId: "x", month: "2026-11", amount: "10" }).success).toBe(false);
    expect(budgetSchema.safeParse({ categoryId: "", month: "2026-13", amount: "10" }).success).toBe(false);
    expect(budgetSchema.safeParse({ categoryId: "", month: "2026-11", amount: "0" }).success).toBe(false);
    expect(budgetSchema.safeParse({ categoryId: "", month: "2026-11", amount: "" }).success).toBe(false);
  });
});

describe("incomeSchema / toIncomeRow", () => {
  const base: IncomeValues = {
    source: "freelance",
    amount: "150.000",
    receivedOn: "2026-11-10",
    client: "Cliente SA",
    note: "",
  };

  it("acepta un ingreso freelance con cliente", () => {
    expect(incomeSchema.safeParse(base).success).toBe(true);
    expect(toIncomeRow(base)).toEqual({
      source: "freelance",
      amount: 15000000,
      received_on: "2026-11-10",
      client: "Cliente SA",
      note: null,
    });
  });

  it("descarta el cliente si no es freelance", () => {
    expect(toIncomeRow({ ...base, source: "familia" }).client).toBeNull();
  });

  it("freelance sin cliente guarda null", () => {
    expect(toIncomeRow({ ...base, client: "" }).client).toBeNull();
  });

  it("rechaza origen, monto o fecha inválidos", () => {
    expect(incomeSchema.safeParse({ ...base, source: "otra" }).success).toBe(false);
    expect(incomeSchema.safeParse({ ...base, amount: "0" }).success).toBe(false);
    expect(incomeSchema.safeParse({ ...base, receivedOn: "2026-02-30" }).success).toBe(false);
  });
});

describe("toRecurringRow", () => {
  const base = {
    name: "Gimnasio",
    amount: "25.000",
    categoryId: CATEGORY,
    dayOfMonth: 5,
    isShared: false,
    myShare: "",
    active: true,
  };

  it("no compartido: my_share = amount", () => {
    expect(toRecurringRow(base)).toEqual({
      category_id: CATEGORY,
      name: "Gimnasio",
      amount: 2500000,
      is_shared: false,
      my_share: 2500000,
      day_of_month: 5,
      active: true,
    });
  });

  it("compartido: la mitad por defecto o la parte indicada", () => {
    expect(toRecurringRow({ ...base, isShared: true }).my_share).toBe(1250000);
    expect(toRecurringRow({ ...base, isShared: true, myShare: "10.000" }).my_share).toBe(1000000);
  });

  it("el día debe estar entre 1 y 28", () => {
    for (const dayOfMonth of [0, 29, 31, 1.5]) {
      expect(recurringSchema.safeParse({ ...base, dayOfMonth }).success).toBe(false);
    }
    for (const dayOfMonth of [1, 15, 28]) {
      expect(recurringSchema.safeParse({ ...base, dayOfMonth }).success).toBe(true);
    }
  });

  it("rechaza nombre vacío, monto inválido y parte mayor al total", () => {
    expect(recurringSchema.safeParse({ ...base, name: " " }).success).toBe(false);
    expect(recurringSchema.safeParse({ ...base, amount: "0" }).success).toBe(false);
    expect(recurringSchema.safeParse({ ...base, isShared: true, myShare: "30.000" }).success).toBe(false);
  });
});
