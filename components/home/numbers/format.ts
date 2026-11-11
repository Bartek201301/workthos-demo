/** The number of decimals a value shows: 12.3 has one, 94781 none. */
export function decimalsOf(value: number): number {
  return (String(value).split(".")[1] ?? "").length;
}

/** A value in en-US with a fixed number of decimals: 94,781 or 12.3. */
export function formatNumber(value: number, decimals: number = decimalsOf(value)): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
