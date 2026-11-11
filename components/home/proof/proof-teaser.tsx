import { GooeyButton, Reveal } from "@/components/brand";
import { mergedPerDay } from "@/lib/build-stats";
import { ProofChart } from "./proof-chart";

/** The one-line summary of the chart, computed from lib. */
export function proofSummary() {
  const days = mergedPerDay("both");
  const total = days.reduce((sum, day) => sum + day.merged, 0);
  const busiest = days.reduce((max, day) => Math.max(max, day.merged), 0);
  return { days: days.length, total, busiest, text: `${total} pull requests merged in ${days.length} days, up to ${busiest} on the busiest day.` };
}

/** Home section 7 (docs/prd.md): a teaser of the dashboard. */
export function ProofTeaser() {
  const data = mergedPerDay("both");
  const summary = proofSummary();
  return (
    <section id="proof" className="mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
      <Reveal>
        <h2 className="font-display text-section leading-none font-extrabold tracking-display uppercase">Proof</h2>
        <div className="mt-8 rounded-card border-2 border-sand-200 bg-sand-100 p-4 sm:p-6">
          <p className="mb-4 text-sm font-semibold tracking-wide text-ink-soft uppercase">Pull requests merged per day, both builds</p>
          <div role="img" aria-label={`Bar chart. ${summary.text}`}>
            <ProofChart data={data} />
          </div>
          <p className="mt-4 text-body" data-testid="proof-summary">
            {summary.text}
          </p>
        </div>
        <div className="mt-8">
          <GooeyButton variant="primary" href="/dashboard">
            Open the dashboard
          </GooeyButton>
        </div>
      </Reveal>
    </section>
  );
}
