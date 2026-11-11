"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  getPullRequests,
  kindCounts,
  linesPerDay,
  median,
  mergedPerDay,
  type ProjectFilter,
} from "@/lib/build-stats";
import { ChartCard, tooltipClassName } from "./chart-card";

export type DashboardChartsProps = {
  project: ProjectFilter;
};

const shortDate = (date: string) => date.slice(5);
const format = (n: number) => n.toLocaleString("en-US");
const plural = (n: number, word: string) => `${format(n)} ${word}${n === 1 ? "" : "s"}`;

const mergedConfig = { merged: { label: "Merged", color: "var(--chart-1)" } } satisfies ChartConfig;
const minutesConfig = { minutes: { label: "Minutes", color: "var(--chart-2)" } } satisfies ChartConfig;
const linesConfig = {
  added: { label: "Added", color: "var(--chart-3)" },
  deleted: { label: "Deleted", color: "var(--chart-4)" },
} satisfies ChartConfig;
const kindConfig = {
  task: { label: "Task PRs", color: "var(--chart-1)" },
  log: { label: "Log PRs", color: "var(--chart-5)" },
} satisfies ChartConfig;

// The bar, line and area charts keep Recharts' keyboard layer: Tab reaches
// each chart (named by its title) and the arrow keys move its tooltip.
// components/ui/chart.tsx hides the chart's outline; on keyboard focus this
// puts back the global forest outline of app/globals.css.
const chartClass = "aspect-auto h-64 w-full [&_.recharts-surface:focus-visible]:outline-solid";

function MergedPerDayChart({ project }: DashboardChartsProps) {
  const data = mergedPerDay(project);
  const total = getPullRequests(project).length;
  const top = data.reduce((best, d) => (d.merged > (best?.merged ?? 0) ? d : best), data[0]);
  const summary = top
    ? `${plural(total, "pull request")} merged over ${plural(data.length, "day")}, most on ${top.date}: ${top.merged}.`
    : "No pull requests merged.";
  return (
    <ChartCard title="Pull requests merged per day" summary={summary}>
      <ChartContainer config={mergedConfig} className={chartClass}>
        <BarChart data={data} accessibilityLayer title="Pull requests merged per day">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent className={tooltipClassName} />} />
          <Bar isAnimationActive={false} dataKey="merged" fill="var(--color-merged)" radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

function MinutesToMergeChart({ project }: DashboardChartsProps) {
  const prs = getPullRequests(project).sort((a, b) => Date.parse(a.mergedAt) - Date.parse(b.mergedAt));
  const data = prs.map((pr, i) => ({ order: i + 1, minutes: pr.minutesToMerge, label: `${pr.project} #${pr.number}` }));
  const med = median(data.map((d) => d.minutes));
  const longest = data.reduce((best, d) => (d.minutes > (best?.minutes ?? 0) ? d : best), data[0]);
  const summary = longest
    ? `Median ${format(med)} minutes from opened to merged over ${plural(data.length, "pull request")}; the longest took ${format(longest.minutes)} minutes (${longest.label}). The scale is logarithmic.`
    : "No pull requests merged.";
  // A log scale keeps the many PRs under 20 minutes readable next to the outliers above 1,400.
  const ticks = [1, 10, 100, 1000, 10000];
  return (
    <ChartCard title="Minutes from PR opened to merged" summary={summary}>
      <ChartContainer config={minutesConfig} className={chartClass}>
        <LineChart data={data} accessibilityLayer title="Minutes from PR opened to merged" margin={{ right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="order" tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis
            scale="log"
            domain={[1, 10000]}
            ticks={ticks}
            allowDataOverflow
            tickFormatter={format}
            tickLine={false}
            axisLine={false}
            width={64}
          >
            <Label value="Minutes (log scale)" angle={-90} position="insideLeft" offset={4} style={{ textAnchor: "middle" }} />
          </YAxis>
          <ChartTooltip
            content={
              <ChartTooltipContent
                className={tooltipClassName}
                labelFormatter={(_, payload) => String(payload?.[0]?.payload?.label ?? "")}
                formatter={(value) => <span>{format(Number(value))} min</span>}
              />
            }
          />
          <Line isAnimationActive={false} dataKey="minutes" type="monotone" stroke="none" dot={{ r: 3, fill: "var(--color-minutes)", stroke: "none" }} activeDot={{ r: 5 }} />
          {Number.isFinite(med) && (
            <ReferenceLine
              y={med}
              stroke="var(--ink)"
              strokeDasharray="4 4"
              label={{ value: `Median ${format(med)}`, position: "insideTopRight", dy: -16, fill: "var(--ink)", stroke: "var(--sand-50)", strokeWidth: 4, paintOrder: "stroke", fontSize: 12, fontWeight: 600 }}
            />
          )}
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}

function LinesPerDayChart({ project }: DashboardChartsProps) {
  const data = linesPerDay(project);
  const added = data.reduce((t, d) => t + d.added, 0);
  const deleted = data.reduce((t, d) => t + d.deleted, 0);
  const summary = `${plural(added, "line")} added and ${plural(deleted, "line")} deleted over ${plural(data.length, "day")}.`;
  return (
    <ChartCard title="Lines added and deleted per day" summary={summary}>
      <ChartContainer config={linesConfig} className={chartClass}>
        <AreaChart data={data} accessibilityLayer title="Lines added and deleted per day">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tickFormatter={format} tickLine={false} axisLine={false} width={48} />
          <ChartTooltip content={<ChartTooltipContent className={tooltipClassName} />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area isAnimationActive={false} dataKey="added" type="monotone" stackId="lines" stroke="var(--color-added)" fill="var(--color-added)" fillOpacity={0.6} />
          <Area isAnimationActive={false} dataKey="deleted" type="monotone" stackId="lines" stroke="var(--color-deleted)" fill="var(--color-deleted)" fillOpacity={0.6} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}

function KindChart({ project }: DashboardChartsProps) {
  const counts = kindCounts(project);
  const total = counts.reduce((t, c) => t + c.count, 0);
  const data = counts.map((c) => ({ ...c, name: kindConfig[c.kind].label, fill: `var(--color-${c.kind})` }));
  const task = counts.find((c) => c.kind === "task")?.count ?? 0;
  const log = counts.find((c) => c.kind === "log")?.count ?? 0;
  const summary = `${task} task and ${log} log pull requests, ${plural(total, "pull request")} in all.`;
  return (
    <ChartCard title="Task PRs vs log PRs" summary={summary}>
      <ChartContainer config={kindConfig} className={chartClass}>
        {/* Two values, both in the summary and the legend: a picture, not a Tab stop. */}
        <PieChart accessibilityLayer={false}>
          <ChartTooltip content={<ChartTooltipContent className={tooltipClassName} hideLabel nameKey="kind" />} />
          <Pie
            isAnimationActive={false}
            rootTabIndex={-1}
            data={data}
            dataKey="count"
            nameKey="kind"
            innerRadius={60}
            outerRadius={90}
            strokeWidth={2}
            stroke="var(--sand-50)"
          >
            {data.map((d) => (
              <Cell key={d.kind} fill={d.fill} />
            ))}
            <Label
              position="center"
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox ? (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle" fill="var(--ink)">
                    <tspan className="text-2xl font-semibold">{total}</tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="kind" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

/** The four dashboard charts for the chosen project filter (docs/prd.md, dashboard). */
export function DashboardCharts({ project }: DashboardChartsProps) {
  return (
    <section aria-label="Charts" className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-2">
      <MergedPerDayChart project={project} />
      <MinutesToMergeChart project={project} />
      <LinesPerDayChart project={project} />
      <KindChart project={project} />
    </section>
  );
}
