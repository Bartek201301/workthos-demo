"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function query(): MediaQueryList | undefined {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(QUERY) : undefined;
}

function subscribe(onChange: () => void) {
  const list = query();
  list?.addEventListener?.("change", onChange);
  return () => list?.removeEventListener?.("change", onChange);
}

/** True when the visitor asked for less motion, read now. */
export function prefersReducedMotion(): boolean {
  return query()?.matches ?? false;
}

/**
 * Whether the visitor asked for less motion, kept up to date.
 *
 * On the server, and while the page hydrates, it answers `true`: no effect
 * starts before the browser has said that motion is welcome, and the server
 * HTML never carries a hidden starting state.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => true);
}
