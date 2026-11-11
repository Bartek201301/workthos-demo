import type { ReactNode } from "react";

/** A sand card around one chart: a figure with its title as figcaption and a text summary. */
export function ChartCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-card border-2 border-sand-200 bg-card p-5 text-card-foreground shadow-soft sm:p-6">
      <figcaption className="text-sm font-semibold tracking-wide uppercase">{title}</figcaption>
      <p className="text-sm text-ink-soft" data-chart-summary>
        {summary}
      </p>
      {children}
    </figure>
  );
}

/** Tooltip look shared by the charts: ink text on sand-50. */
export const tooltipClassName = "border-sand-200 bg-sand-50 text-ink shadow-soft";
