import { vi } from "vitest";

/** Makes window.matchMedia answer `reduce` for "(prefers-reduced-motion: reduce)". Restore with vi.restoreAllMocks(). */
export function mockReducedMotion(reduce: boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string): MediaQueryList => ({
      matches: reduce && query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  );
}
