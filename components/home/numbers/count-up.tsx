"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { decimalsOf, formatNumber } from "./format";

const reducedMotion = "(prefers-reduced-motion: reduce)";

export type CountUpProps = {
  value: number;
  className?: string;
};

/**
 * A number that counts up from 0 once, when it scrolls into view (Motion).
 * The server HTML and reduced motion show the final value. The moving digits
 * are aria-hidden: assistive tech always reads the final value from the
 * visually hidden text.
 */
export function CountUp({ value, className }: CountUpProps) {
  const digits = useRef<HTMLSpanElement>(null);
  const inView = useInView(digits, { once: true, amount: 0.5 });
  const decimals = decimalsOf(value);

  useEffect(() => {
    const node = digits.current;
    if (!node) return;
    if (window.matchMedia?.(reducedMotion).matches) {
      node.textContent = formatNumber(value, decimals);
      return;
    }
    if (!inView) {
      node.textContent = formatNumber(0, decimals);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (latest) => {
        node.textContent = formatNumber(latest, decimals);
      },
    });
    return () => controls.stop();
  }, [inView, value, decimals]);

  return (
    <span className={className}>
      <span ref={digits} aria-hidden="true" data-testid="count-up-digits">
        {formatNumber(value, decimals)}
      </span>
      <span className="sr-only">{formatNumber(value, decimals)}</span>
    </span>
  );
}
