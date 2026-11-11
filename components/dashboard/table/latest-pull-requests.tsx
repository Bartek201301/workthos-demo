import { latestMerged, type ProjectFilter } from "@/lib/build-stats";

export type LatestPullRequestsProps = {
  project: ProjectFilter;
};

/** Placeholder: the table task adds the table of the latest 20 merged pull requests. */
export function LatestPullRequests({ project }: LatestPullRequestsProps) {
  return (
    <section
      aria-label="Latest pull requests"
      className="rounded-card border-2 border-sand-200 bg-card p-6 text-card-foreground"
    >
      <h2 className="text-sm font-semibold tracking-wide uppercase">Latest pull requests</h2>
      <p className="mt-2 text-ink-soft">
        {latestMerged(project, 20).length} latest merged pull requests for {project}
      </p>
    </section>
  );
}
