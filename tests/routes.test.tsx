// The routes and the contracts of the later tasks (issue 3, criterion 10).
// The home page renders its nine sections, in order, each with its id.
// The dashboard page renders DashboardHeader and DashboardView; they are
// replaced by markers here, so this test keeps passing whatever they render.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import HomePage from "@/app/page";

vi.mock("@/components/dashboard/header/dashboard-header", () => ({
  DashboardHeader: () => <div data-testid="dashboard-header" />,
}));
vi.mock("@/components/dashboard/view/dashboard-view", () => ({
  DashboardView: () => <div data-testid="dashboard-view" />,
}));

const sectionIds = ["hero", "numbers", "how-it-works", "rules", "ui-lane", "day", "proof", "faq", "install"];

describe("home page", () => {
  it("renders the nine sections in order inside main#main", () => {
    const { container } = render(<HomePage />);
    const main = container.querySelector("main#main");
    expect(main).not.toBeNull();
    const ids = Array.from(main!.querySelectorAll("section[id]"), (section) => section.id);
    expect(ids.filter((id) => sectionIds.includes(id))).toEqual(sectionIds);
    for (const id of sectionIds) expect(main!.querySelector(`#${id}`)?.tagName).toBe("SECTION");
  });
});

describe("dashboard page", () => {
  it("renders the header, then the view, inside main#main", () => {
    render(<DashboardPage />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    const header = within(main).getByTestId("dashboard-header");
    const view = within(main).getByTestId("dashboard-view");
    expect(header.compareDocumentPosition(view) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
