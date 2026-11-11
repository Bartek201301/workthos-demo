import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./reveal";
import { mockReducedMotion } from "./test-utils";

const { animate } = vi.hoisted(() => ({ animate: vi.fn() }));
vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  animate,
}));

/** Puts every element `top` px from the top of the viewport (jsdom has no layout). */
function placeAt(top: number) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ x: 0, y: top, width: 100, height: 100 }),
  );
}

/** An IntersectionObserver whose callback the test triggers, for the targets it still observes. */
let observed: { callback: IntersectionObserverCallback; targets: Element[] }[] = [];
class TestObserver {
  private entry: { callback: IntersectionObserverCallback; targets: Element[] };
  constructor(callback: IntersectionObserverCallback) {
    this.entry = { callback, targets: [] };
    observed.push(this.entry);
  }
  observe(target: Element) {
    this.entry.targets.push(target);
  }
  unobserve(target: Element) {
    this.entry.targets = this.entry.targets.filter((t) => t !== target);
  }
  disconnect() {
    this.entry.targets = [];
  }
  takeRecords() {
    return [];
  }
}

function scrollIntoView() {
  act(() => {
    for (const { callback, targets } of observed) {
      if (targets.length === 0) continue;
      const entries = targets.map((target) => ({ target, isIntersecting: true }) as unknown as IntersectionObserverEntry);
      callback(entries, {} as IntersectionObserver);
    }
  });
}

beforeEach(() => {
  observed = [];
  vi.stubGlobal("IntersectionObserver", TestObserver);
});

afterEach(() => {
  animate.mockClear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Reveal", () => {
  it("renders its children", () => {
    render(
      <Reveal>
        <h2>Install</h2>
      </Reveal>,
    );
    expect(screen.getByRole("heading", { name: "Install" })).toBeInTheDocument();
  });

  it("under reduced motion, has no opacity or transform style, even below the screen", () => {
    mockReducedMotion(true);
    placeAt(5000);
    render(
      <Reveal>
        <p>Below the fold</p>
      </Reveal>,
    );
    const wrapper = screen.getByText("Below the fold").parentElement!;
    expect(wrapper.style.opacity).toBe("");
    expect(wrapper.style.transform).toBe("");
    expect(wrapper).not.toHaveAttribute("style");
    scrollIntoView();
    expect(animate).not.toHaveBeenCalled();
  });

  it("leaves content that is already on the screen as it is", () => {
    mockReducedMotion(false);
    placeAt(100);
    render(
      <Reveal>
        <p>On the first screen</p>
      </Reveal>,
    );
    expect(screen.getByText("On the first screen").parentElement).not.toHaveAttribute("style");
  });

  it("hides content below the screen, keeps it in the DOM, and reveals it once when it scrolls into view", () => {
    mockReducedMotion(false);
    placeAt(5000);
    render(
      <Reveal>
        <p>Below the fold</p>
      </Reveal>,
    );
    const wrapper = screen.getByText("Below the fold").parentElement!;
    expect(wrapper.style.opacity).toBe("0");
    expect(wrapper.style.transform).toBe("translateY(24px)");

    scrollIntoView();
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledWith(
      wrapper,
      { opacity: [0, 1], y: ["24px", "0px"] },
      { duration: 0.5, ease: "easeOut" },
    );

    scrollIntoView();
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it("reads the distance and duration from the reveal tokens", () => {
    mockReducedMotion(false);
    placeAt(5000);
    document.documentElement.style.setProperty("--reveal-distance", "32px");
    document.documentElement.style.setProperty("--reveal-duration", "400ms");
    try {
      render(
        <Reveal>
          <p>Tuned</p>
        </Reveal>,
      );
      scrollIntoView();
      expect(animate).toHaveBeenCalledWith(expect.anything(), { opacity: [0, 1], y: ["32px", "0px"] }, { duration: 0.4, ease: "easeOut" });
    } finally {
      document.documentElement.style.removeProperty("--reveal-distance");
      document.documentElement.style.removeProperty("--reveal-duration");
    }
  });
});
