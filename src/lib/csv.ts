/**
 * CSV pensado para abrir en Excel/Sheets con configuración regional argentina:
 * separador ";", coma decimal, UTF-8 con BOM y saltos de línea CRLF.
 */

const BOM = "﻿";

/** Centavos -> "12500,50" (siempre con dos decimales, sin separador de miles). */
export function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const decimals = String(abs % 100).padStart(2, "0");
  return `${sign}${Math.trunc(abs / 100)},${decimals}`;
}

/**
 * Evita la inyección de fórmulas: una nota que empiece con = + - @ se interpretaría
 * como fórmula al abrir el archivo. Se antepone un apóstrofe.
 */
export function sanitizeCsvText(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function quote(cell: string): string {
  return /[;"\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function toCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map((row) => row.map(quote).join(";"));
  return BOM + lines.join("\r\n") + "\r\n";
}
