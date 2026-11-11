import { describe, expect, it } from "vitest";
import { brotherBalance } from "./balance";

describe("brotherBalance", () => {
  it("suma lo que puse por mi hermano", () => {
    const result = brotherBalance(
      [
        { amount_total: 10000, my_share: 5000 },
        { amount_total: 3001, my_share: 1500 },
      ],
      [],
    );
    expect(result).toEqual({ owed: 6501, settled: 0, balance: 6501 });
  });

  it("descuenta lo saldado", () => {
    const result = brotherBalance([{ amount_total: 10000, my_share: 5000 }], [2000, 1000]);
    expect(result).toEqual({ owed: 5000, settled: 3000, balance: 2000 });
  });

  it("saldado por completo: balance cero", () => {
    expect(brotherBalance([{ amount_total: 10000, my_share: 5000 }], [5000]).balance).toBe(0);
  });

  it("si se saldó de más (por ejemplo, se borró un gasto) el balance es negativo", () => {
    expect(brotherBalance([{ amount_total: 2000, my_share: 1000 }], [3000]).balance).toBe(-2000);
  });

  it("sin gastos compartidos todo es cero", () => {
    expect(brotherBalance([], [])).toEqual({ owed: 0, settled: 0, balance: 0 });
  });
});
