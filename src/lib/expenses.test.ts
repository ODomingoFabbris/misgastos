import { describe, expect, it } from "vitest";
import { expenseSchema, type ExpenseValues } from "@/lib/validators/expense";
import { halfShare, toExpenseRow } from "./expenses";

const CATEGORY = "3f1c2a52-6a0e-4f0a-9d53-1d2a8a1b7c11";

const base: ExpenseValues = {
  amount: "12.500,50",
  categoryId: CATEGORY,
  spentOn: "2026-11-10",
  note: "",
  isShared: false,
  myShare: "",
};

describe("expenseSchema", () => {
  it("acepta un gasto válido", () => {
    expect(expenseSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza monto cero, vacío o inválido", () => {
    for (const amount of ["", "0", "abc", "1,234"]) {
      expect(expenseSchema.safeParse({ ...base, amount }).success).toBe(false);
    }
  });

  it("rechaza categoría o fecha inválidas", () => {
    expect(expenseSchema.safeParse({ ...base, categoryId: "" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, spentOn: "2026-02-30" }).success).toBe(false);
  });

  it("limita la nota a 200 caracteres", () => {
    expect(expenseSchema.safeParse({ ...base, note: "a".repeat(201) }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, note: "a".repeat(200) }).success).toBe(true);
  });

  it("la parte propia no puede superar el total", () => {
    const shared = { ...base, isShared: true };
    expect(expenseSchema.safeParse({ ...shared, myShare: "20.000" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...shared, myShare: "6.000" }).success).toBe(true);
    expect(expenseSchema.safeParse({ ...shared, myShare: "" }).success).toBe(true);
  });
});

describe("toExpenseRow", () => {
  it("un gasto no compartido: my_share = amount_total", () => {
    const row = toExpenseRow(base);
    expect(row.amount_total).toBe(1250050);
    expect(row.my_share).toBe(1250050);
    expect(row.is_shared).toBe(false);
    expect(row.note).toBeNull();
  });

  it("compartido sin parte indicada: la mitad", () => {
    const row = toExpenseRow({ ...base, amount: "10.000", isShared: true });
    expect(row.amount_total).toBe(1000000);
    expect(row.my_share).toBe(500000);
  });

  it("compartido con parte indicada", () => {
    const row = toExpenseRow({ ...base, amount: "10.000", isShared: true, myShare: "3.000" });
    expect(row.my_share).toBe(300000);
  });

  it("ignora myShare si no es compartido", () => {
    const row = toExpenseRow({ ...base, myShare: "1" });
    expect(row.my_share).toBe(row.amount_total);
  });

  it("guarda la nota si existe", () => {
    expect(toExpenseRow({ ...base, note: "Super" }).note).toBe("Super");
  });
});

describe("halfShare", () => {
  it("redondea hacia abajo con centavos impares", () => {
    expect(halfShare(1001)).toBe(500);
    expect(halfShare(1000)).toBe(500);
  });
});
