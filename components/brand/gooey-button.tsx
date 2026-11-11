"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

type GooeyButtonBase = {
  variant: "primary" | "secondary";
  children: ReactNode;
  className?: string;
};

/** A link (href) or a button (onClick). */
export type GooeyButtonProps = GooeyButtonBase &
  ({ href: string; onClick?: never } | { onClick: MouseEventHandler<HTMLButtonElement>; href?: never });

const variants = {
  primary: "bg-forest text-sand-50",
  secondary: "border-2 border-ink text-ink",
} as const;

/** Placeholder: the brand task replaces the inside with liquid-gooey (docs/design.md, effects). */
export function GooeyButton({ variant, children, className, ...action }: GooeyButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-pill px-6 py-3 font-semibold",
    variants[variant],
    className,
  );
  if (action.href !== undefined) {
    return (
      <a href={action.href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={classes}>
      {children}
    </button>
  );
}
