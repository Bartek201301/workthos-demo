import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GooeyButton } from "./gooey-button";

describe("GooeyButton", () => {
  it("renders a real link with its href", () => {
    render(
      <GooeyButton variant="primary" href="/dashboard">
        Open the dashboard
      </GooeyButton>,
    );
    const link = screen.getByRole("link", { name: "Open the dashboard" });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a real button that calls onClick on click and on Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GooeyButton variant="primary" onClick={onClick}>
        Try it
      </GooeyButton>,
    );
    const button = screen.getByRole("button", { name: "Try it" });
    expect(button).toHaveAttribute("type", "button");

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("draws the primary variant as a forest pill on a liquid-gooey surface", () => {
    const { container } = render(
      <GooeyButton variant="primary" href="#install" className="mt-4">
        Get started
      </GooeyButton>,
    );
    const link = screen.getByRole("link", { name: "Get started" });
    expect(link).toHaveClass("rounded-pill", "bg-forest", "text-sand-50");

    const group = container.firstElementChild as HTMLElement;
    expect(group).toHaveAttribute("data-gooey-button", "primary");
    expect(group).toHaveClass("mt-4");
    expect(group).toContainElement(link);
    // The liquid layer the library draws: decorative, inert, hidden from assistive tech.
    const liquid = group.querySelector("svg[data-gooey-svg]");
    expect(liquid).not.toBeNull();
    expect(liquid).toHaveAttribute("aria-hidden", "true");
    expect(liquid).toHaveAttribute("focusable", "false");
  });

  it("draws the secondary variant as an ink outline without goo", () => {
    const { container } = render(
      <GooeyButton variant="secondary" href="#how-it-works" className="mt-4">
        See how it works
      </GooeyButton>,
    );
    const link = screen.getByRole("link", { name: "See how it works" });
    expect(link).toHaveClass("rounded-pill", "border-2", "border-ink", "text-ink", "mt-4");
    expect(link).not.toHaveClass("bg-forest");
    expect(container.firstElementChild).toBe(link);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("keeps the secondary button a real button too", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GooeyButton variant="secondary" onClick={onClick}>
        Cancel
      </GooeyButton>,
    );
    const button = screen.getByRole("button", { name: "Cancel" });
    expect(button).toHaveAttribute("type", "button");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
