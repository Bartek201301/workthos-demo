import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UiLane } from "./ui-lane";

describe("UiLane", () => {
  it("has the heading and names the design files that builders only read", () => {
    const { container } = render(<UiLane />);
    expect(screen.getByRole("heading", { level: 2, name: "Your UI lane" })).toBeTruthy();
    const text = container.textContent ?? "";
    expect(text).toContain("styles/tokens.css");
    expect(text).toContain("docs/design.md");
    expect(text).toMatch(/builders only read/i);
  });
});
