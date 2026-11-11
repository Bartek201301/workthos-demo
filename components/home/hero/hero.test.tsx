import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

describe("Hero", () => {
  it("has the wordmark as the only h1, and the tagline", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector("section#hero")).not.toBeNull();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveAccessibleName(/^workthos$/i);
    expect(screen.getByText("You plan. They build. The machine merges.")).toBeInTheDocument();
  });

  it("links to the install section and to how it works", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "#install");
    expect(screen.getByRole("link", { name: "See how it works" })).toHaveAttribute("href", "#how-it-works");
  });

  it("shows the three robots, the builder working", () => {
    render(<Hero />);
    expect(screen.getAllByRole("img", { name: /robot/ })).toHaveLength(3);
    expect(screen.getByRole("img", { name: "lead robot, idle" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "builder robot, working" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "machine robot, idle" })).toBeInTheDocument();
  });
});
