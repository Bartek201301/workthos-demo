"use client";

import { Liquid } from "liquid-gooey";
import { useState, type MouseEventHandler, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./use-reduced-motion";

type GooeyButtonBase = {
  variant: "primary" | "secondary";
  children: ReactNode;
  /** Goes on the outermost element. */
  className?: string;
};

/** A link (href) or a button (onClick). */
export type GooeyButtonProps = GooeyButtonBase &
  ({ href: string; onClick?: never } | { onClick: MouseEventHandler<HTMLButtonElement>; href?: never });

type Action = Pick<GooeyButtonProps, "href" | "onClick">;

const pill = "inline-flex items-center justify-center rounded-pill px-6 py-3 font-semibold";

/** The real control: an <a href> or a <button type="button">, so focus and keyboard work as usual. */
function Control({ action, className, children }: { action: Action; className: string; children: ReactNode }) {
  if (action.href !== undefined) {
    return (
      <a href={action.href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {children}
    </button>
  );
}

// How far the drop slides out of the pill's right end on hover or focus, in px.
const DROP_TRAVEL = 18;

/**
 * The primary button: a forest pill on a liquid-gooey surface. On hover or
 * focus a small drop of the same liquid slides out of its end and is pulled
 * back in when the pointer or the focus leaves. The pill itself is also
 * painted in forest, so it looks the same before the liquid is measured and
 * without JavaScript. Under reduced motion the drop stays inside.
 */
function PrimaryButton({ action, className, children }: { action: Action; className?: string; children: ReactNode }) {
  const reduce = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = !reduce && (hovered || focused);

  return (
    <Liquid
      fill="var(--forest)"
      data-gooey-button="primary"
      className={cn("inline-flex align-middle", className)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Liquid.Item style={{ display: "flex", flex: "1 1 auto" }}>
        <Control action={action} className={cn(pill, "w-full bg-forest text-sand-50")}>
          {children}
        </Control>
      </Liquid.Item>
      <Liquid.Item
        x={open ? DROP_TRAVEL : 0}
        transition="bouncy"
        style={{ position: "absolute", top: "calc(50% - 0.4375rem)", right: "0.75rem", pointerEvents: "none" }}
      >
        <span aria-hidden="true" className="block size-3.5 rounded-pill" />
      </Liquid.Item>
    </Liquid>
  );
}

/**
 * The site's pill button (docs/design.md, buttons). Primary is the gooey
 * forest pill; secondary is an ink outline without goo.
 */
export function GooeyButton({ variant, children, className, ...action }: GooeyButtonProps) {
  if (variant === "primary") {
    return (
      <PrimaryButton action={action} className={className}>
        {children}
      </PrimaryButton>
    );
  }
  return (
    <Control action={action} className={cn(pill, "border-2 border-ink text-ink", className)}>
      {children}
    </Control>
  );
}
