import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { combinedSummary } from "@/lib/build-stats";
import { NumbersBand } from "./numbers-band";

/** The text assistive tech gets: the text of the element, without its aria-hidden parts. */
function accessibleText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node instanceof Element && node.getAttribute("aria-hidden") === "true") return "";
  return Array.from(node.childNodes, accessibleText).join("");
}

/** The number shown for a label: the dd of the same item. */
function numberFor(label: string): HTMLElement {
  const dt = screen.getByText(label, { selector: "dt" });
  const dd = dt.parentElement?.querySelector("dd");
  if (!dd) throw new Error(`no number for ${label}`);
  return dd;
}

function expectedNumbers() {
  const s = combinedSummary();
  return [
    ["Merged pull requests", s.mergedPullRequests],
    ["Conflicts in main", s.conflictsInMain],
    ["Median minutes from PR to merge", s.medianMinutesToMerge],
    ["Lines added", s.linesAdded],
  ] as const;
}

function mockMatchMedia(reduced: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("NumbersBand", () => {
  it("shows the four labels, in order", () => {
    const { container } = render(<NumbersBand />);
    expect(container.querySelector("section#numbers")).not.toBeNull();
    const labels = Array.from(container.querySelectorAll("dt"), (dt) => dt.textContent);
    expect(labels).toEqual(expectedNumbers().map(([label]) => label));
  });

  it("gives assistive tech the final lib value of each number, in en-US", () => {
    render(<NumbersBand />);
    for (const [label, value] of expectedNumbers()) {
      expect(accessibleText(numberFor(label))).toBe(value.toLocaleString("en-US"));
    }
  });

  it("hides the moving digits from assistive tech, and starts them at 0 until they are in view", () => {
    render(<NumbersBand />);
    const digits = screen.getAllByTestId("count-up-digits");
    expect(digits).toHaveLength(4);
    for (const d of digits) {
      expect(d).toHaveAttribute("aria-hidden", "true");
      expect(d.textContent).toMatch(/^0(\.0)?$/);
    }
  });

  it("shows the final values at once under reduced motion", () => {
    mockMatchMedia(true);
    render(<NumbersBand />);
    const shown = screen.getAllByTestId("count-up-digits").map((d) => d.textContent);
    expect(shown).toEqual(expectedNumbers().map(([, value]) => value.toLocaleString("en-US")));
  });

  it("counts up to the final values once they scroll into view", async () => {
    // An IntersectionObserver that reports every element as visible.
    class VisibleObserver {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as never);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", VisibleObserver);
    render(<NumbersBand />);
    const expected = expectedNumbers().map(([, value]) => value.toLocaleString("en-US"));
    await waitFor(
      () => expect(screen.getAllByTestId("count-up-digits").map((d) => d.textContent)).toEqual(expected),
      { timeout: 4000 },
    );
  });

  it("has at most one handwritten note", () => {
    const { container } = render(<NumbersBand />);
    expect(container.querySelectorAll(".font-hand").length).toBeLessThanOrEqual(1);
  });
});
