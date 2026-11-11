import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LatestPullRequests } from "./latest-pull-requests";
import { latestMerged } from "@/lib/build-stats";

describe("LatestPullRequests", () => {
  it("lists the rows in lib order with lib values", () => {
    render(<LatestPullRequests project="both" />);
    const expected = latestMerged("both", 20);
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(expected.length);
    expected.forEach((pr, i) => {
      const cells = within(rows[i]).getAllByRole("cell").map((c) => c.textContent);
      expect(cells).toEqual([pr.project, String(pr.number), pr.title, pr.minutesToMerge.toFixed(1), String(pr.additions)]);
    });
  });

  it("has the columns and a caption, and no project column for one project", () => {
    const { rerender } = render(<LatestPullRequests project="both" />);
    const names = (t: HTMLElement) => within(t).getAllByRole("columnheader").map((h) => h.textContent);
    expect(names(screen.getByRole("table"))).toEqual(["Project", "Number", "Title", "Minutes to merge", "Lines added"]);
    expect(screen.getByRole("table").querySelector("caption")).not.toBeNull();
    rerender(<LatestPullRequests project="workthos" />);
    expect(names(screen.getByRole("table"))).toEqual(["Number", "Title", "Minutes to merge", "Lines added"]);
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(latestMerged("workthos", 20).length + 1);
  });
});
