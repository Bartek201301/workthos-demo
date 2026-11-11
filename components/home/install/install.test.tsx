import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { site } from "@/lib/site";
import { Install } from "./install";

describe("Install", () => {
  it("copies the exact command and says Copied", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Install />);
    await user.click(screen.getByRole("button", { name: /copy command/i }));
    expect(writeText).toHaveBeenCalledWith(site.installCommand);
    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(screen.getByText("Copied").closest("[aria-live]")).not.toBeNull();
  });

  it("leaves the copy button's focus to the global forest outline", () => {
    render(<Install />);
    const button = screen.getByRole("button", { name: /copy command/i });
    expect(button).not.toHaveClass("outline-none");
    expect(button.className).not.toMatch(/(^|\s)focus-visible:(outline-none|ring)/);
  });

  it("links to the repository", () => {
    render(<Install />);
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", site.repositoryUrl);
  });
});
