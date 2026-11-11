"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { readToken } from "./tokens";
import { usePrefersReducedMotion } from "./use-reduced-motion";

export type SectionBackgroundProps = {
  kind: "hero";
};

// The React Bits background, kept as installed in components/vendor/. It is
// loaded in the browser only, in its own chunk, after the page has hydrated:
// it adds nothing to the server HTML and does not hold up the first paint.
const Grainient = dynamic(() => import("@/components/vendor/Grainient"), { ssr: false });

// docs/design.md, effects: slow and subtle, tinted with sand, lilac and sage.
// Grainient parses its colours on a 2D canvas, which does not understand
// var(...), so the tokens are read as the browser resolved them.
const heroColours = ["--sand-50", "--sand-100", "--lilac", "--sage"] as const;

function HeroGrainient() {
  // Read once, in the browser: this component never renders on the server.
  const [colours] = useState(() => heroColours.map((token) => readToken(token)));
  if (colours.some((colour) => colour === "")) return null;
  return (
    <Grainient
      colors={colours}
      angle={160}
      speed={0.35}
      flow={0.6}
      silk={0.2}
      grainAmount={0.035}
      grainAnimated={false}
      saturation={0.9}
      interactive={false}
      clickSwirl={false}
    />
  );
}

/**
 * The one decorative background of the site, behind the hero
 * (docs/design.md, effects). Put it first inside a `relative isolate`
 * section: it fills the section, sits behind its content, takes no pointer
 * events and is hidden from assistive tech. It renders nothing on the server
 * and nothing under reduced motion.
 */
export function SectionBackground({ kind }: SectionBackgroundProps) {
  const reduce = usePrefersReducedMotion();
  if (reduce) return null;
  return (
    <div
      aria-hidden="true"
      data-section-background={kind}
      className="pointer-events-none absolute inset-0 -z-10 mask-b-from-60% select-none"
    >
      <HeroGrainient />
    </div>
  );
}
