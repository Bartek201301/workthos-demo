import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SectionBackground } from "./section-background";
import { mockReducedMotion } from "./test-utils";

// jsdom has no WebGL: the vendor component is replaced by a marker that
// records its props.
const { Grainient } = vi.hoisted(() => ({
  Grainient: vi.fn((props: { colors?: string[] }) => <div data-testid="grainient" data-colors={props.colors?.join("|")} />),
}));
vi.mock("@/components/vendor/Grainient", () => ({ default: Grainient }));

const tokens = {
  "--sand-50": "rgb(246, 241, 228)",
  "--sand-100": "rgb(239, 231, 211)",
  "--lilac": "rgb(204, 167, 228)",
  "--sage": "rgb(132, 186, 143)",
};

afterEach(() => {
  for (const name of Object.keys(tokens)) document.documentElement.style.removeProperty(name);
  Grainient.mockClear();
  vi.restoreAllMocks();
});

describe("SectionBackground", () => {
  it("renders nothing under reduced motion", () => {
    mockReducedMotion(true);
    const { container } = render(<SectionBackground kind="hero" />);
    expect(container).toBeEmptyDOMElement();
    expect(Grainient).not.toHaveBeenCalled();
  });

  it("renders an aria-hidden, inert layer behind the section otherwise", () => {
    mockReducedMotion(false);
    const { container } = render(<SectionBackground kind="hero" />);
    const layer = container.firstElementChild as HTMLElement;
    expect(layer).not.toBeNull();
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).toHaveClass("absolute", "inset-0", "-z-10", "pointer-events-none");
  });

  it("colours the Grainient from the tokens as the browser resolved them", async () => {
    mockReducedMotion(false);
    for (const [name, value] of Object.entries(tokens)) document.documentElement.style.setProperty(name, value);
    const { findByTestId } = render(<SectionBackground kind="hero" />);
    const grainient = await findByTestId("grainient");
    expect(grainient).toHaveAttribute("data-colors", Object.values(tokens).join("|"));
    expect(grainient.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("draws no Grainient when the tokens are missing", async () => {
    mockReducedMotion(false);
    const { container } = render(<SectionBackground kind="hero" />);
    await waitFor(() => expect(container.firstElementChild).not.toBeNull());
    expect(Grainient).not.toHaveBeenCalled();
  });
});
