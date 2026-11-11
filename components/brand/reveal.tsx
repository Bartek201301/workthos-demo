"use client";

import type { ReactNode } from "react";

export type RevealProps = {
  children: ReactNode;
};

/** Placeholder: renders its children. The brand task adds the Motion scroll reveal, off under reduced motion. */
export function Reveal({ children }: RevealProps) {
  return <>{children}</>;
}
