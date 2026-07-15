/** Quotes a CSV field only when it contains a character that would otherwise
 * corrupt the row (comma, double-quote, or newline), escaping embedded quotes
 * by doubling them per RFC 4180. */
export function escapeCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}
