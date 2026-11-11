import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Rules } from "./rules";

const titles = [
  "One task, one worktree, one PR",
  "Every file has an owner",
  "The lead approves one exact commit",
  "Only the machine merges",
];

describe("Rules", () => {
  it("shows the four rule titles in order, each in its own card", () => {
    const { container } = render(<Rules />);
    expect(container.querySelector("section#rules")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "The rules" })).toBeTruthy();
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(4);
    cards.forEach((card, i) => {
      expect(within(card).getByRole("heading", { level: 3 }).textContent).toBe(titles[i]);
    });
  });
});
