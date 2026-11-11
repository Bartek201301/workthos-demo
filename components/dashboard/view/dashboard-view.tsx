"use client";

import { useState } from "react";
import { DashboardCharts } from "@/components/dashboard/charts/dashboard-charts";
import { LatestPullRequests } from "@/components/dashboard/table/latest-pull-requests";
import type { ProjectFilter } from "@/lib/build-stats";

/** Holds the project filter and renders the switch, the charts and the table. */
export function DashboardView() {
  // The switch task adds the setter and the HackWin / workthos / both switch.
  const [project] = useState<ProjectFilter>("both");
  return (
    <div className="mx-auto flex max-w-content flex-col gap-8 px-4 pb-section-mobile sm:px-6">
      <div
        role="group"
        aria-label="Project"
        className="self-start rounded-pill border-2 border-dashed border-sand-200 px-4 py-2 text-sm font-semibold uppercase"
      >
        Project: {project}
      </div>
      <DashboardCharts project={project} />
      <LatestPullRequests project={project} />
    </div>
  );
}
