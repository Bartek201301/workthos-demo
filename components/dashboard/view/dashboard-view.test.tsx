import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DashboardView } from "./dashboard-view";
import { latestMerged } from "@/lib/build-stats";

const rowCount = () => within(screen.getByRole("table")).getAllByRole("row").length - 1;

describe("DashboardView", () => {
  it("switches the table with the keyboard and never empties", async () => {
    const user = userEvent.setup();
    render(<DashboardView />);
    const group = screen.getByRole("group", { name: "Project" });
    const both = within(group).getByRole("button", { name: "Both" });
    expect(both).toHaveAttribute("aria-pressed", "true");
    expect(rowCount()).toBe(20);

    const wt = within(group).getByRole("button", { name: "workthos" });
    wt.focus();
    await user.keyboard("{Enter}");
    expect(wt).toHaveAttribute("aria-pressed", "true");
    expect(rowCount()).toBe(latestMerged("workthos", 20).length);
    expect(rowCount()).toBe(6);

    const hw = within(group).getByRole("button", { name: "HackWin" });
    hw.focus();
    await user.keyboard(" ");
    expect(hw).toHaveAttribute("aria-pressed", "true");
    expect(rowCount()).toBe(20);
    const first = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(within(first).getAllByRole("cell")[0]).toHaveTextContent(String(latestMerged("HackWin", 1)[0].number));

    await user.keyboard(" "); // pressing the selected one must not empty the switch
    expect(hw).toHaveAttribute("aria-pressed", "true");
  });

  it("takes the pressed look and the focus outline from the toggle itself", () => {
    render(<DashboardView />);
    for (const item of within(screen.getByRole("group", { name: "Project" })).getAllByRole("button")) {
      // components/ui/toggle.tsx: pressed is forest with sand-50 text, no important override here.
      expect(item).toHaveClass("aria-pressed:bg-forest", "aria-pressed:text-sand-50");
      expect(item.className).not.toContain("!");
      // Focus is the global forest outline: no outline-none, no faint ring.
      expect(item).not.toHaveClass("outline-none");
      expect(item.className).not.toMatch(/focus-visible:ring/);
    }
  });
});
