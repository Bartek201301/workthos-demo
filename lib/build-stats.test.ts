import { describe, expect, it } from "vitest";
import {
  combinedSummary,
  getBuildStats,
  getProjects,
  getPullRequests,
  kindCounts,
  latestMerged,
  linesPerDay,
  median,
  mergedPerDay,
  type ProjectFilter,
} from "./build-stats";

const filters: ProjectFilter[] = ["HackWin", "workthos", "both"];

describe("build-stats against data/build-stats.json", () => {
  it("has two projects named HackWin and workthos", () => {
    expect(getBuildStats().projects.map((p) => p.name)).toEqual(["HackWin", "workthos"]);
  });

  it("only has the pull request kinds task and log", () => {
    for (const pr of getPullRequests("both")) expect(["task", "log"]).toContain(pr.kind);
  });

  describe.each(getBuildStats().projects.map((p) => [p.name, p] as const))("project %s", (_, project) => {
    it("counts every pull request as merged", () => {
      expect(project.summary.mergedPullRequests).toBe(project.pullRequests.length);
    });

    it("sums the additions into linesAdded", () => {
      const additions = project.pullRequests.reduce((total, pr) => total + pr.additions, 0);
      expect(project.summary.linesAdded).toBe(additions);
    });

    it("recomputes the median minutes to merge within 0.05 of the summary", () => {
      const recomputed = median(project.pullRequests.map((pr) => pr.minutesToMerge));
      expect(Math.abs(recomputed - project.summary.medianMinutesToMerge)).toBeLessThanOrEqual(0.05);
    });
  });

  it("combines both projects: 92 merged, 0 conflicts, 94781 lines added", () => {
    const summary = combinedSummary();
    expect(summary.mergedPullRequests).toBe(92);
    expect(summary.conflictsInMain).toBe(0);
    expect(summary.linesAdded).toBe(94781);
    expect(summary.medianMinutesToMerge).toBe(
      Math.round(median(getPullRequests("both").map((pr) => pr.minutesToMerge)) * 10) / 10,
    );
  });

  it.each(filters)("selects the projects for %s", (filter) => {
    const names = getProjects(filter).map((p) => p.name);
    expect(names).toEqual(filter === "both" ? ["HackWin", "workthos"] : [filter]);
  });

  it.each(filters)("mergedPerDay and kindCounts each sum to the pull requests for %s", (filter) => {
    const total = getPullRequests(filter).length;
    expect(mergedPerDay(filter).reduce((sum, day) => sum + day.merged, 0)).toBe(total);
    expect(kindCounts(filter).reduce((sum, kind) => sum + kind.count, 0)).toBe(total);
  });

  it.each(filters)("lists days as ascending UTC dates for %s", (filter) => {
    for (const days of [mergedPerDay(filter), linesPerDay(filter)]) {
      const dates = days.map((day) => day.date);
      for (const date of dates) expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dates).toEqual([...dates].sort());
      expect(new Set(dates).size).toBe(dates.length);
    }
  });

  it.each(filters)("linesPerDay sums to the lines of the pull requests for %s", (filter) => {
    const prs = getPullRequests(filter);
    const days = linesPerDay(filter);
    expect(days.reduce((sum, day) => sum + day.added, 0)).toBe(prs.reduce((sum, pr) => sum + pr.additions, 0));
    expect(days.reduce((sum, day) => sum + day.deleted, 0)).toBe(prs.reduce((sum, pr) => sum + pr.deletions, 0));
  });

  it('latestMerged("both", 20) has 20 items, newest first', () => {
    const latest = latestMerged("both", 20);
    expect(latest).toHaveLength(20);
    const times = latest.map((pr) => Date.parse(pr.mergedAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    const newest = Math.max(...getPullRequests("both").map((pr) => Date.parse(pr.mergedAt)));
    expect(times[0]).toBe(newest);
  });
});

describe("median", () => {
  it("takes the middle value of an odd list, in any order", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([7])).toBe(7);
  });

  it("averages the two middle values of an even list", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([10, 20])).toBe(15);
  });

  it("is NaN for an empty list and does not change its input", () => {
    expect(median([])).toBeNaN();
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });
});
