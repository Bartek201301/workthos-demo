import { Reveal } from "@/components/brand";

export function UiLane() {
  return (
    <section id="ui-lane" className="mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
      <Reveal>
        <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">Your lane</p>
        <h2 className="font-display text-section leading-none font-extrabold tracking-display uppercase">
          Your UI lane
        </h2>
        <div className="mt-8 max-w-2xl space-y-4">
          <p>
            You own the design files: <code className="font-semibold">styles/tokens.css</code> and{" "}
            <code className="font-semibold">docs/design.md</code>.
          </p>
          <p>Keep changing the look while the builders work. They never touch those files.</p>
          <p>Builders only read them.</p>
          <p className="font-hand text-2xl text-plum">Restyle freely. They keep up.</p>
        </div>
      </Reveal>
    </section>
  );
}
