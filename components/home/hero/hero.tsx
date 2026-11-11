/** Placeholder for home section 1 (docs/prd.md). */
export function Hero() {
  return (
    <section id="hero" className="mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
      <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">#hero</p>
      {/* Below 390 px the hero size (at least 4rem) is wider than the screen, so it starts at the section size. */}
      <h1 className="font-display text-section leading-none font-extrabold tracking-display uppercase min-[390px]:text-hero">
        workthos
      </h1>
      <p className="mt-4 text-body">You plan. They build. The machine merges.</p>
      <p className="mt-2 font-hand text-xl text-plum">placeholder: the hero comes in wave 2</p>
    </section>
  );
}
