"use client";

import { useState } from "react";
import { DashboardCharts } from "@/components/dashboard/charts/dashboard-charts";
import { LatestPullRequests } from "@/components/dashboard/table/latest-pull-requests";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ProjectFilter } from "@/lib/build-stats";

const OPTIONS: { value: ProjectFilter; label: string }[] = [
  { value: "HackWin", label: "HackWin" },
  { value: "workthos", label: "workthos" },
  { value: "both", label: "Both" },
];

/** Holds the project filter and renders the switch, the charts and the table. */
export function DashboardView() {
  const [project, setProject] = useState<ProjectFilter>("both");
  return (
    <div className="mx-auto flex max-w-content flex-col gap-8 px-4 pb-section-mobile sm:px-6">
      <ToggleGroup
        aria-label="Project"
        value={[project]}
        onValueChange={(next: string[]) => {
          // Single choice, never empty: ignore the click that would unselect.
          if (next.length > 0) setProject(next[next.length - 1] as ProjectFilter);
        }}
        spacing={1}
        className="self-start rounded-pill border-2 border-sand-200 bg-sand-100 p-1"
      >
        {OPTIONS.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            className="h-9 rounded-pill px-4 text-xs font-semibold tracking-wide text-ink uppercase hover:bg-sand-200 hover:text-ink aria-pressed:bg-forest! aria-pressed:text-sand-50!"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DashboardCharts project={project} />
      <LatestPullRequests project={project} />
    </div>
  );
}
