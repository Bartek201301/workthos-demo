import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  getPullRequests,
  kindCounts,
  linesPerDay,
  median,
  mergedPerDay,
  type ProjectFilter,
} from "@/lib/build-stats";
import { DashboardCharts } from "./dashboard-charts";

const titles = [
  "Pull requests merged per day",
  "Minutes from PR opened to merged",
  "Lines added and deleted per day",
  "Task PRs vs log PRs",
];
const filters: ProjectFilter[] = ["both", "HackWin", "workthos"];
const format = (n: number) => n.toLocaleString("en-US");

function summaryOf(title: string): string {
  const figure = screen.getByText(title).closest("figure") as HTMLElement;
  return figure.querySelector("[data-chart-summary]")?.textContent ?? "";
}

describe("DashboardCharts", () => {
  it.each(filters)("renders four titled figures for %s", (filter) => {
    const { container } = render(<DashboardCharts project={filter} />);
    for (const title of titles) {
      const caption = screen.getByText(title);
      expect(caption.tagName).toBe("FIGCAPTION");
    }
    expect(container.querySelectorAll("figure")).toHaveLength(4);
    expect(within(container).getAllByText(/./, { selector: "[data-chart-summary]" })).toHaveLength(4);
  });

  it.each(filters)("summaries show the lib totals for %s", (filter) => {
    render(<DashboardCharts project={filter} />);
    const prs = getPullRequests(filter);
    const days = mergedPerDay(filter);
    const top = days.reduce((a, b) => (b.merged > a.merged ? b : a));
    expect(summaryOf(titles[0])).toContain(`${format(prs.length)} pull request`);
    expect(summaryOf(titles[0])).toContain(`${days.length} day`);
    expect(summaryOf(titles[0])).toContain(`most on ${top.date}: ${top.merged}`);

    expect(summaryOf(titles[1])).toContain(`Median ${format(median(prs.map((p) => p.minutesToMerge)))} minutes`);
    expect(summaryOf(titles[1])).toContain(`${format(prs.length)} pull request`);

    const lines = linesPerDay(filter);
    const added = lines.reduce((t, d) => t + d.added, 0);
    const deleted = lines.reduce((t, d) => t + d.deleted, 0);
    expect(summaryOf(titles[2])).toContain(`${format(added)} lines added`);
    expect(summaryOf(titles[2])).toContain(`${format(deleted)} lines deleted`);

    const [task, log] = kindCounts(filter);
    expect(summaryOf(titles[3])).toContain(`${task.count} task and ${log.count} log`);
  });

  it("shows 6 task and 0 log for workthos", () => {
    render(<DashboardCharts project="workthos" />);
    expect(summaryOf(titles[3])).toContain("6 task and 0 log");
  });
});
