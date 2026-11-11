import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Faq } from "./faq";

const required = [
  ["Do I need an organization repo?", "No."],
  ["Which models?", "The lead picks Sonnet or Opus per task."],
  ["Does it work with Codex?", "Not in version 1."],
  ["What if a builder goes outside its task?", "The hook blocks it, and the machine rejects the PR."],
];

describe("Faq", () => {
  it("has the four questions with their answers", () => {
    render(<Faq />);
    for (const [question, answer] of required) {
      expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
      expect(screen.getByText(answer, { exact: true })).toBeInTheDocument();
    }
  });

  it("opens an item with the Enter key", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const trigger = screen.getByRole("button", { name: "Which models?" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.tab();
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("opens an item with the Space key", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const trigger = screen.getByRole("button", { name: "Does it work with Codex?" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    trigger.focus();
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("shows the global forest outline on focus, not the faint ring", () => {
    render(<Faq />);
    for (const trigger of screen.getAllByRole("button")) {
      expect(trigger).toHaveClass(
        "focus-visible:outline-solid",
        "focus-visible:outline-2",
        "focus-visible:outline-ring",
        "focus-visible:ring-0",
      );
      expect(trigger).not.toHaveClass("focus-visible:ring-3");
    }
  });
});
