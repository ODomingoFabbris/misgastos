import { describe, expect, it } from "vitest";
import { centsToInputValue, formatCents, parsePesosToCents } from "./money";

describe("parsePesosToCents", () => {
  it("convierte formato argentino a centavos", () => {
    expect(parsePesosToCents("12.500,50")).toBe(1250050);
    expect(parsePesosToCents("12500,5")).toBe(1250050);
    expect(parsePesosToCents("1.234.567")).toBe(123456700);
  });

  it("acepta enteros sin separadores", () => {
    expect(parsePesosToCents("12500")).toBe(1250000);
    expect(parsePesosToCents("0")).toBe(0);
    expect(parsePesosToCents("0,99")).toBe(99);
  });

  it("ignora espacios y el signo $ inicial", () => {
    expect(parsePesosToCents("  $ 1.000 ")).toBe(100000);
  });

  it("no pierde centavos por coma flotante", () => {
    expect(parsePesosToCents("0,29")).toBe(29);
    expect(parsePesosToCents("1,15")).toBe(115);
    expect(parsePesosToCents("19,99")).toBe(1999);
  });

  it("rechaza texto inválido", () => {
    expect(parsePesosToCents("")).toBeNull();
    expect(parsePesosToCents("abc")).toBeNull();
    expect(parsePesosToCents("12,345")).toBeNull();
    expect(parsePesosToCents("12.50")).toBeNull();
    expect(parsePesosToCents("-5")).toBeNull();
    expect(parsePesosToCents("1,2,3")).toBeNull();
  });

  it("rechaza montos fuera del rango seguro", () => {
    expect(parsePesosToCents("99999999999999999999")).toBeNull();
  });
});

describe("formatCents", () => {
  it("formatea en pesos argentinos", () => {
    const normalized = formatCents(1250050).replace(/\s/g, " ");
    expect(normalized).toBe("$ 12.500,50");
  });

  it("formatea cero y montos chicos", () => {
    expect(formatCents(0).replace(/\s/g, " ")).toBe("$ 0,00");
    expect(formatCents(5).replace(/\s/g, " ")).toBe("$ 0,05");
  });
});

describe("centsToInputValue", () => {
  it("devuelve texto editable", () => {
    expect(centsToInputValue(1250050)).toBe("12500,50");
    expect(centsToInputValue(1250000)).toBe("12500");
    expect(centsToInputValue(5)).toBe("0,05");
  });

  it("ida y vuelta con parsePesosToCents", () => {
    for (const cents of [1, 99, 100, 123456, 1250050]) {
      expect(parsePesosToCents(centsToInputValue(cents))).toBe(cents);
    }
  });
});
