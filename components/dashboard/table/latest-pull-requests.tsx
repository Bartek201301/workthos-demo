import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { latestMerged, type ProjectFilter } from "@/lib/build-stats";

export type LatestPullRequestsProps = {
  project: ProjectFilter;
};

const num = "text-right tabular-nums";

/** The latest 20 merged pull requests, newest first. */
export function LatestPullRequests({ project }: LatestPullRequestsProps) {
  const rows = latestMerged(project, 20);
  const showProject = project === "both";
  return (
    <section
      aria-labelledby="latest-prs-title"
      className="rounded-card border-2 border-sand-200 bg-card p-4 text-card-foreground shadow-soft sm:p-6"
    >
      <h2 id="latest-prs-title" className="text-sm font-semibold tracking-wide uppercase">
        Latest pull requests
      </h2>
      {/* The scroll container is the labelled region: it takes keyboard focus when the table is wider than the card. */}
      <Table scrollRegionLabel="Latest pull requests table, scrollable" containerClassName="mt-4 rounded-lg">
        <TableCaption className="sr-only">The {rows.length} latest merged pull requests, newest first</TableCaption>
        <TableHeader>
          <TableRow className="text-xs tracking-wide text-ink-soft uppercase">
            {showProject && <TableHead scope="col">Project</TableHead>}
            <TableHead scope="col" className={num}>
              Number
            </TableHead>
            <TableHead scope="col">Title</TableHead>
            <TableHead scope="col" className={num}>
              Minutes to merge
            </TableHead>
            <TableHead scope="col" className={num}>
              Lines added
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((pr) => (
            <TableRow key={`${pr.project}-${pr.number}`}>
              {showProject && <TableCell className="font-semibold">{pr.project}</TableCell>}
              <TableCell className={num}>{pr.number}</TableCell>
              <TableCell className="max-w-[28rem] min-w-[14rem] whitespace-normal">{pr.title}</TableCell>
              <TableCell className={num}>{pr.minutesToMerge.toFixed(1)}</TableCell>
              <TableCell className={num}>{pr.additions.toLocaleString("en-US")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
