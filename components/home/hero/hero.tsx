import { GooeyButton, Robot, SectionBackground, type RobotRole, type RobotState } from "@/components/brand";

// docs/prd.md: the three robots appear here, the builder in its working state.
const cast: { role: RobotRole; state: RobotState }[] = [
  { role: "lead", state: "idle" },
  { role: "builder", state: "working" },
  { role: "machine", state: "idle" },
];

/**
 * Home section 1 (docs/prd.md): the wordmark, the tagline, the two buttons and
 * the three robots. A server component, and not wrapped in Reveal: it is the
 * first paint.
 */
export function Hero() {
  return (
    // `relative isolate`: SectionBackground is an absolute layer behind the content (agreed with the brand task).
    <section id="hero" className="relative isolate overflow-x-clip">
      <SectionBackground kind="hero" />
      <div className="relative mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
        <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">
          Open source · Claude Code in parallel
        </p>
        {/*
          Narrow-screen fallback. The h1 is a size container at the hero size.
          The span takes that size, or the size at which the wordmark fits the
          container when that is smaller, so it never scrolls sideways whatever
          the hero token's minimum is. The wordmark measures 5.64em in Bricolage
          Grotesque; 5.8 leaves a margin for the fallback font.
        */}
        <h1 className="mt-4 @container font-display text-hero font-extrabold tracking-display uppercase">
          <span className="block text-[length:min(1em,calc(100cqi/5.8))] leading-[0.85]">workthos</span>
        </h1>
        <div className="mt-8 flex flex-col gap-10 md:mt-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-display text-2xl leading-tight font-bold tracking-display uppercase sm:text-3xl">
              You plan. They build. The machine merges.
            </p>
            <p className="mt-4 text-ink-soft">One developer, many Claude Code sessions, one GitHub repository.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <GooeyButton variant="primary" href="#install">
                Get started
              </GooeyButton>
              <GooeyButton variant="secondary" href="#how-it-works">
                See how it works
              </GooeyButton>
            </div>
          </div>
          <ul aria-label="The cast" className="flex flex-wrap items-end justify-between gap-2 sm:justify-start sm:gap-6">
            {cast.map((robot) => (
              <li key={robot.role} className="flex flex-col items-center gap-2">
                <Robot role={robot.role} state={robot.state} size={104} />
                {/* The robot's accessible name already says its role: the tag is for the eyes only. */}
                <span
                  aria-hidden="true"
                  className="rounded-pill border-2 border-sand-200 bg-sand-50 px-3 py-0.5 text-xs font-semibold tracking-wide uppercase"
                >
                  {robot.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
