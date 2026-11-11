import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardHeader } from "./dashboard-header";
import { combinedSummary, getBuildStats } from "@/lib/build-stats";

describe("DashboardHeader", () => {
  it("shows the status line computed from lib", () => {
    const s = combinedSummary();
    const n = getBuildStats().projects.length;
    render(<DashboardHeader />);
    expect(
      screen.getByText(`${n} builds, ${s.mergedPullRequests} pull requests, ${s.conflictsInMain} conflicts in main`),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
  });

  it("shows the three robots with their states", () => {
    render(<DashboardHeader />);
    expect(screen.getByRole("img", { name: "lead robot, idle" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "builder robot, working" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "machine robot, idle" })).toBeInTheDocument();
  });
});
