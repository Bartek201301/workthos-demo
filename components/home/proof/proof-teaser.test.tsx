import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mergedPerDay } from "@/lib/build-stats";
import { ProofTeaser } from "./proof-teaser";

describe("ProofTeaser", () => {
  it("links the button to the dashboard", () => {
    render(<ProofTeaser />);
    expect(screen.getByRole("link", { name: "Open the dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("states the numbers of lib", () => {
    render(<ProofTeaser />);
    const days = mergedPerDay("both");
    const total = days.reduce((sum, d) => sum + d.merged, 0);
    const busiest = Math.max(...days.map((d) => d.merged));
    expect(screen.getByTestId("proof-summary")).toHaveTextContent(
      `${total} pull requests merged in ${days.length} days, up to ${busiest} on the busiest day.`,
    );
  });
});
