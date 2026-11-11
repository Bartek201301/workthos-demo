"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { MergedPerDay } from "@/lib/build-stats";

const config = {
  merged: { label: "Merged", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Pull requests merged per day, as a small bar chart. It sits inside a
 * role="img" with a text summary, so it is a picture: no keyboard layer and
 * no Tab stop (the dashboard has the explorable charts).
 */
export function ProofChart({ data }: { data: MergedPerDay[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full sm:h-56">
      <BarChart data={data} accessibilityLayer={false}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(d: string) => d.slice(5)} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="merged" fill="var(--color-merged)" radius={6} />
      </BarChart>
    </ChartContainer>
  );
}
