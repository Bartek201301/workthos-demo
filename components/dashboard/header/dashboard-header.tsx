import { Robot } from "@/components/brand";
import { combinedSummary, getBuildStats } from "@/lib/build-stats";

/** The dashboard title, the three robots and the one-line status, all from lib. */
export function DashboardHeader() {
  const summary = combinedSummary();
  const builds = getBuildStats().projects.length;
  return (
    <header className="mx-auto max-w-content px-4 pt-section-mobile pb-8 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-section leading-none font-extrabold tracking-display uppercase">
            Dashboard
          </h1>
          <p className="mt-4 text-body text-ink-soft">
            {builds} builds, {summary.mergedPullRequests} pull requests, {summary.conflictsInMain} conflicts in main
          </p>
        </div>
        <div className="flex items-end gap-3">
          <Robot role="lead" state="idle" size={72} />
          <Robot role="builder" state="working" size={72} />
          <Robot role="machine" state="idle" size={72} />
        </div>
      </div>
    </header>
  );
}
