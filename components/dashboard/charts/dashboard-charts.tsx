import { getPullRequests, type ProjectFilter } from "@/lib/build-stats";

export type DashboardChartsProps = {
  project: ProjectFilter;
};

/** Placeholder: the charts task adds the four shadcn charts (docs/prd.md, dashboard). */
export function DashboardCharts({ project }: DashboardChartsProps) {
  return (
    <section
      aria-label="Charts"
      className="rounded-card border-2 border-sand-200 bg-card p-6 text-card-foreground shadow-soft"
    >
      <h2 className="text-sm font-semibold tracking-wide uppercase">Charts</h2>
      <p className="mt-2 text-ink-soft">
        {getPullRequests(project).length} pull requests for {project}
      </p>
    </section>
  );
}
