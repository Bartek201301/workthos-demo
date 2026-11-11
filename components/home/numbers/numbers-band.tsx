import { combinedSummary } from "@/lib/build-stats";
import { CountUp } from "./count-up";

type BandNumber = { label: string; value: number; note?: string };

/** The four numbers of the band, both builds together, all from lib. */
export function bandNumbers(): BandNumber[] {
  const summary = combinedSummary();
  return [
    { label: "Merged pull requests", value: summary.mergedPullRequests },
    {
      label: "Conflicts in main",
      value: summary.conflictsInMain,
      // The one Kalam note of the section, only while it is true.
      note: summary.conflictsInMain === 0 ? "Zero conflicts. Not a typo." : undefined,
    },
    { label: "Median minutes from PR to merge", value: summary.medianMinutesToMerge },
    { label: "Lines added", value: summary.linesAdded },
  ];
}

/** Home section 2 (docs/prd.md): four big numbers from the two real builds. They count up once. */
export function NumbersBand() {
  const numbers = bandNumbers();
  return (
    <section id="numbers" aria-labelledby="numbers-title" className="bg-sand-100">
      <div className="mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
        <h2 id="numbers-title" className="text-sm font-semibold tracking-wide text-ink-soft uppercase">
          Two real builds, by the numbers
        </h2>
        <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 border-y-2 border-dashed border-sand-200 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {numbers.map((number) => (
            <div key={number.label} className="flex flex-col gap-2">
              <dt className="text-sm font-semibold tracking-wide uppercase">{number.label}</dt>
              <dd className="order-first">
                <CountUp
                  value={number.value}
                  className="font-display text-6xl leading-none font-extrabold tracking-display text-forest tabular-nums xl:text-7xl"
                />
              </dd>
              {number.note && <dd className="font-hand text-xl text-plum">{number.note}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
