import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HowItWorks } from "./how-it-works";

const loop = [
  { title: "Plan", robot: "lead robot, working" },
  { title: "Build", robot: "builder robot, working" },
  { title: "Review", robot: "lead robot, working" },
  { title: "Merge", robot: "machine robot, working" },
];

describe("HowItWorks", () => {
  it("is the loop in four steps, in order, each with the robot of its role", () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector("section#how-it-works")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "How it works" })).toBeInTheDocument();
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(loop.length);
    items.forEach((item, i) => {
      expect(within(item).getByRole("heading", { level: 3 })).toHaveTextContent(loop[i].title);
      const robots = within(item).getAllByRole("img");
      expect(robots).toHaveLength(1);
      expect(robots[0]).toHaveAccessibleName(loop[i].robot);
    });
  });

  it("says plainly in the merge step that no model merges", () => {
    render(<HowItWorks />);
    const merge = within(screen.getByRole("list")).getAllByRole("listitem")[3];
    expect(merge).toHaveTextContent(/no model/i);
  });
});
