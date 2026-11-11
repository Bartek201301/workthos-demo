// The typed loader for data/build-stats.json (docs/spec.md, contract 2).
// Pages and components read the build data only through this module.
// The JSON is imported statically, so it works in server and client components.
import raw from "@/data/build-stats.json";

export type PullRequest = {
  number: number;
  title: string;
  kind: "task" | "log";
  openedAt: string;
  mergedAt: string;
  minutesToMerge: number;
  additions: number;
  deletions: number;
};

export type Summary = {
  mergedPullRequests: number;
  abandonedPullRequests: number;
  conflictsInMain: number;
  medianMinutesToMerge: number;
  linesAdded: number;
  linesDeleted: number;
};

export type Project = {
  name: string;
  description: string;
  repository: string;
  summary: Summary;
  pullRequests: PullRequest[];
};

export type BuildStats = {
  generatedAt: string;
  note: string;
  projects: Project[];
};

export type ProjectFilter = "HackWin" | "workthos" | "both";

/** A pull request with the name of its project (numbers repeat across projects). */
export type ProjectPullRequest = PullRequest & { project: string };

export type MergedPerDay = { date: string; merged: number };
export type LinesPerDay = { date: string; added: number; deleted: number };
export type KindCount = { kind: PullRequest["kind"]; count: number };

const stats = raw as BuildStats;

export function getBuildStats(): BuildStats {
  return stats;
}

/** The projects the filter selects: one project, or both. */
export function getProjects(filter: ProjectFilter): Project[] {
  return filter === "both" ? stats.projects : stats.projects.filter((p) => p.name === filter);
}

/** Every pull request of the selected projects, each with its project name. */
export function getPullRequests(filter: ProjectFilter): ProjectPullRequest[] {
  return getProjects(filter).flatMap((p) => p.pullRequests.map((pr) => ({ ...pr, project: p.name })));
}

/** The median of the values; NaN for an empty list. */
export function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const roundOne = (value: number) => Math.round(value * 10) / 10;

/**
 * The summary of both projects: counts and lines summed over the projects,
 * the median minutes to merge computed over all their pull requests and,
 * like the per-project summaries, rounded to one decimal.
 */
export function combinedSummary(): Summary {
  const sum = (key: keyof Summary) => stats.projects.reduce((total, p) => total + p.summary[key], 0);
  return {
    mergedPullRequests: sum("mergedPullRequests"),
    abandonedPullRequests: sum("abandonedPullRequests"),
    conflictsInMain: sum("conflictsInMain"),
    medianMinutesToMerge: roundOne(median(getPullRequests("both").map((pr) => pr.minutesToMerge))),
    linesAdded: sum("linesAdded"),
    linesDeleted: sum("linesDeleted"),
  };
}

/** The UTC date YYYY-MM-DD of an ISO timestamp. */
function utcDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Groups the pull requests by the UTC day they merged, ascending. */
function byMergeDay(filter: ProjectFilter): [string, ProjectPullRequest[]][] {
  const days = new Map<string, ProjectPullRequest[]>();
  for (const pr of getPullRequests(filter)) {
    const day = utcDay(pr.mergedAt);
    const list = days.get(day);
    if (list) list.push(pr);
    else days.set(day, [pr]);
  }
  return [...days.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

/** Pull requests merged per UTC day, ascending; only days with a merge. */
export function mergedPerDay(filter: ProjectFilter): MergedPerDay[] {
  return byMergeDay(filter).map(([date, prs]) => ({ date, merged: prs.length }));
}

/** Lines added and deleted per UTC day of merge, ascending; only days with a merge. */
export function linesPerDay(filter: ProjectFilter): LinesPerDay[] {
  return byMergeDay(filter).map(([date, prs]) => ({
    date,
    added: prs.reduce((total, pr) => total + pr.additions, 0),
    deleted: prs.reduce((total, pr) => total + pr.deletions, 0),
  }));
}

/** Task and log pull requests, always both kinds in this order. */
export function kindCounts(filter: ProjectFilter): KindCount[] {
  const prs = getPullRequests(filter);
  return (["task", "log"] as const).map((kind) => ({
    kind,
    count: prs.filter((pr) => pr.kind === kind).length,
  }));
}

/** The n most recently merged pull requests, newest first. */
export function latestMerged(filter: ProjectFilter, n: number): ProjectPullRequest[] {
  return getPullRequests(filter)
    .sort((a, b) => Date.parse(b.mergedAt) - Date.parse(a.mergedAt))
    .slice(0, Math.max(0, n));
}
