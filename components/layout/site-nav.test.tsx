import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { site } from "@/lib/site";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";
import { SkipLink } from "./skip-link";

describe("SiteNav", () => {
  it("links the wordmark to the home page", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: site.name })).toHaveAttribute("href", "/");
  });

  it("has How it works, Dashboard and GitHub in the main navigation, with their hrefs", () => {
    render(<SiteNav />);
    const nav = within(screen.getByRole("navigation", { name: "Main" }));
    const links = nav.getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")]);
    expect(links).toEqual([
      ["How it works", "/#how-it-works"],
      ["Dashboard", "/dashboard"],
      ["GitHub", site.repositoryUrl],
    ]);
  });

  it("reads the repository URL from lib/site.ts", () => {
    expect(site.repositoryUrl).toBe("https://github.com/Bartek201301/workthos");
  });
});

describe("SkipLink", () => {
  it("links to #main and is the first thing the keyboard reaches", async () => {
    render(
      <>
        <SkipLink />
        <SiteNav />
      </>,
    );
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    await userEvent.tab();
    expect(skip).toHaveFocus();
  });

  it("is visually hidden until it gets focus", () => {
    render(<SkipLink />);
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveClass("sr-only");
    expect(skip).toHaveClass("focus:not-sr-only");
  });
});

describe("SiteFooter", () => {
  it("links to the repository", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", site.repositoryUrl);
  });
});
