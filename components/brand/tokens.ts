/**
 * Reads a design token (a CSS custom property of styles/tokens.css) as the
 * browser resolved it on <html>. For the props that need a real colour or
 * length rather than `var(...)`. Returns "" when the token is not defined or
 * when there is no document (the server).
 */
export function readToken(name: `--${string}`): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** A CSS time ("0.5s", "500ms") in seconds, or the fallback when it is not one. */
export function toSeconds(value: string, fallback: number): number {
  const match = /^(-?[\d.]+)(m?s)$/.exec(value.trim());
  if (!match) return fallback;
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return fallback;
  return match[2] === "ms" ? amount / 1000 : amount;
}
