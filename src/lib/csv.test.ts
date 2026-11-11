import { describe, expect, it } from "vitest";
import { centsToDecimal, sanitizeCsvText, toCsv } from "./csv";

describe("centsToDecimal", () => {
  it("siempre dos decimales con coma", () => {
    expect(centsToDecimal(1250050)).toBe("12500,50");
    expect(centsToDecimal(1250000)).toBe("12500,00");
    expect(centsToDecimal(5)).toBe("0,05");
    expect(centsToDecimal(0)).toBe("0,00");
  });
});

describe("sanitizeCsvText", () => {
  it("neutraliza fórmulas", () => {
    expect(sanitizeCsvText("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(sanitizeCsvText("+54 351")).toBe("'+54 351");
    expect(sanitizeCsvText("-1")).toBe("'-1");
    expect(sanitizeCsvText("@cmd")).toBe("'@cmd");
  });

  it("deja el texto normal como está", () => {
    expect(sanitizeCsvText("Súper del barrio")).toBe("Súper del barrio");
    expect(sanitizeCsvText("")).toBe("");
  });
});

describe("toCsv", () => {
  it("usa ; y CRLF, con BOM", () => {
    const csv = toCsv(["a", "b"], [["1", "2"]]);
    expect(csv).toBe("﻿a;b\r\n1;2\r\n");
  });

  it("entrecomilla celdas con separador, comillas o saltos de línea", () => {
    const csv = toCsv(["nota"], [["a;b"], ['dijo "hola"'], ["línea 1\nlínea 2"]]);
    expect(csv).toContain('"a;b"');
    expect(csv).toContain('"dijo ""hola"""');
    expect(csv).toContain('"línea 1\nlínea 2"');
  });
});
