import { fireEvent, render, screen } from "@testing-library/react";
import type { BotAvatarProps } from "bot-avatars";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Robot, type RobotRole, type RobotState } from "./robot";
import { mockReducedMotion } from "./test-utils";

const { BotAvatar } = vi.hoisted(() => ({
  // Like the real one: a canvas with role "img"; the avatar's own props are not DOM attributes.
  BotAvatar: vi.fn(({ type, state, size, shading, paused, ...canvas }: BotAvatarProps) => {
    void [type, state, size, shading, paused];
    return <canvas role="img" {...canvas} />;
  }),
}));
vi.mock("bot-avatars", () => ({ BotAvatar, default: BotAvatar }));

/** The props of the last BotAvatar render. */
function lastProps(): BotAvatarProps {
  const calls = BotAvatar.mock.calls;
  return calls[calls.length - 1][0];
}

const types: Record<RobotRole, string> = { lead: "flower", builder: "circle", machine: "mech" };
const states: Record<RobotState, string> = { idle: "default", working: "working", sleeping: "default" };

afterEach(() => {
  BotAvatar.mockClear();
  vi.restoreAllMocks();
});

describe("Robot", () => {
  for (const role of Object.keys(types) as RobotRole[]) {
    for (const state of Object.keys(states) as RobotState[]) {
      it(`renders the ${role} robot, ${state}, as one BotAvatar`, () => {
        render(<Robot role={role} state={state} size={72} />);
        const props = lastProps();
        expect(props.type).toBe(types[role]);
        expect(props.state).toBe(states[state]);
        expect(props.size).toBe(72);
        expect(props.shading).toBe("fabric");
        expect(props.paused).toBeUndefined();
        expect(props["aria-label"]).toBe(`${role} robot, ${state}`);
        expect(screen.getAllByRole("img")).toHaveLength(1);
        expect(screen.getByRole("img", { name: `${role} robot, ${state}` })).toBeInTheDocument();
      });
    }
  }

  it("sizes the avatar with BotAvatar's size prop only, 96 by default", () => {
    render(<Robot role="lead" state="idle" />);
    const props = lastProps();
    expect(props.size).toBe(96);
    expect(props.style).toBeUndefined();
    expect(props.width).toBeUndefined();
    expect(props.height).toBeUndefined();
    expect(props.className).toBeUndefined();
  });

  it("never asks for the plastic look or a paused avatar", () => {
    render(<Robot role="builder" state="sleeping" />);
    expect(lastProps().shading).not.toBe("plastic");
    expect(lastProps().paused).toBeUndefined();
  });

  it("hops slightly on hover", () => {
    mockReducedMotion(false);
    render(<Robot role="machine" state="idle" />);
    const canvas = screen.getByRole("img");
    const animate = vi.fn();
    Object.assign(canvas, { animate });
    fireEvent.pointerEnter(canvas);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0][1]).toMatchObject({ id: "robot-hop" });
  });

  it("does not hop under reduced motion", () => {
    mockReducedMotion(true);
    render(<Robot role="machine" state="idle" />);
    const canvas = screen.getByRole("img");
    const animate = vi.fn();
    Object.assign(canvas, { animate });
    fireEvent.pointerEnter(canvas);
    expect(animate).not.toHaveBeenCalled();
  });
});
