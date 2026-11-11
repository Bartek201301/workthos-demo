"use client";

import { animate, inView, type AnimationPlaybackControls } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { readToken, toSeconds } from "./tokens";
import { usePrefersReducedMotion } from "./use-reduced-motion";

export type RevealProps = {
  children: ReactNode;
};

/**
 * The scroll reveal (docs/design.md, effects): the content rises from
 * --reveal-distance and fades in over --reveal-duration, once, when it
 * scrolls into view.
 *
 * The server HTML is the finished content: the hidden starting state is
 * set in the browser, only on content that is still below the screen, so
 * nothing on the first screen waits for JavaScript or flashes. Under
 * reduced motion the content is never hidden or moved. The children are
 * always in the DOM.
 */
export function Reveal({ children }: RevealProps) {
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (reduce || !element) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    const distance = readToken("--reveal-distance") || "24px";
    const duration = toSeconds(readToken("--reveal-duration"), 0.5);
    element.style.opacity = "0";
    element.style.transform = `translateY(${distance})`;

    let reveal: AnimationPlaybackControls | undefined;
    const stop = inView(
      element,
      () => {
        stop();
        reveal = animate(element, { opacity: [0, 1], y: [distance, "0px"] }, { duration, ease: "easeOut" });
      },
      { margin: "0px 0px -10% 0px" },
    );
    return () => {
      stop();
      if (reveal) reveal.complete();
      else {
        element.style.opacity = "";
        element.style.transform = "";
      }
    };
  }, [reduce]);

  return <div ref={ref}>{children}</div>;
}
