import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LatestPullRequests } from "./latest-pull-requests";
import { latestMerged } from "@/lib/build-stats";

describe("LatestPullRequests", () => {
  it("lists the rows in lib order with lib values, lines added in en-US", () => {
    render(<LatestPullRequests project="both" />);
    const expected = latestMerged("both", 20);
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(expected.length);
    expected.forEach((pr, i) => {
      const cells = within(rows[i]).getAllByRole("cell").map((c) => c.textContent);
      expect(cells).toEqual([
        pr.project,
        String(pr.number),
        pr.title,
        pr.minutesToMerge.toFixed(1),
        pr.additions.toLocaleString("en-US"),
      ]);
    });
  });

  it("writes lines added with thousands separators", () => {
    render(<LatestPullRequests project="both" />);
    const big = latestMerged("both", 20).find((pr) => pr.additions >= 1000);
    // The data has PRs of more than a thousand lines; if it ever has none, there is nothing to separate.
    expect(big).toBeDefined();
    const row = screen.getByRole("cell", { name: big!.title }).closest("tr")!;
    const cells = within(row).getAllByRole("cell");
    expect(cells[cells.length - 1].textContent).toMatch(/^\d{1,3}(,\d{3})+$/);
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

  it("makes the scroll container the labelled region the keyboard can focus", () => {
    render(<LatestPullRequests project="both" />);
    const region = screen.getByRole("region", { name: "Latest pull requests table, scrollable" });
    expect(region).toHaveAttribute("data-slot", "table-container");
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toContainElement(screen.getByRole("table"));
    // No local focus style: the global forest outline of app/globals.css shows.
    expect(region.className).not.toMatch(/outline-none|ring-ring/);
    // One scroll container only: no nested wrapper that turns the table's own scroll off.
    expect(region.className).not.toMatch(/overflow-visible/);
    expect(region.parentElement?.closest("[role=region]")).toBeNull();
  });
});
