import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DayTimeline } from "./day-timeline";

describe("DayTimeline", () => {
  it("is an ordered list of timed entries, labelled as an example", () => {
    render(<DayTimeline />);
    expect(screen.getByText(/example day/i)).toBeTruthy();
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(4);
    const times = items.map((li) => li.querySelector("time")?.textContent ?? "");
    expect(times).toEqual([...times].sort());
    for (const t of ["09:00", "09:10", "10:30", "18:00"]) expect(times).toContain(t);
  });

  it("says the 10:30 entry once, without repeating itself", () => {
    render(<DayTimeline />);
    const entry = within(screen.getByRole("list"))
      .getAllByRole("listitem")
      .find((li) => li.querySelector("time")?.textContent === "10:30");
    expect(entry?.querySelector("p")?.textContent).toBe("The machine merges the first reviewed PRs.");
    expect(entry?.textContent?.match(/merge/gi)).toHaveLength(1);
  });
});
