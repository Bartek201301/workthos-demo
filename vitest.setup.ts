import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// Browser APIs that jsdom lacks and that Motion, Recharts and the brand
// effects call. They do nothing here: no media query matches and nothing
// is ever observed as visible or resized.
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  if (!("IntersectionObserver" in window)) {
    Object.assign(window, { IntersectionObserver: NoopObserver });
  }
  if (!("ResizeObserver" in window)) {
    Object.assign(window, { ResizeObserver: NoopObserver });
  }
}
