import { combinedSummary, getBuildStats } from "@/lib/build-stats";

/** Placeholder: the dashboard header task adds the robots (docs/prd.md, dashboard). */
export function DashboardHeader() {
  const summary = combinedSummary();
  const builds = getBuildStats().projects.length;
  return (
    <header className="mx-auto max-w-content px-4 pt-section-mobile pb-8 sm:px-6">
      <h1 className="font-display text-section leading-none font-extrabold tracking-display uppercase">
        Dashboard
      </h1>
      <p className="mt-4 text-body text-ink-soft">
        {builds} builds, {summary.mergedPullRequests} pull requests, {summary.conflictsInMain} conflicts in main
      </p>
    </header>
  );
}
