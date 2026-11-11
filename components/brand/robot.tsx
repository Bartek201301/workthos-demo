"use client";

import { BotAvatar, type BotAvatarState, type BotAvatarType } from "bot-avatars";
import type { PointerEvent } from "react";
import { prefersReducedMotion } from "./use-reduced-motion";

export type RobotRole = "lead" | "builder" | "machine";
export type RobotState = "idle" | "working" | "sleeping";

export type RobotProps = {
  role: RobotRole;
  state: RobotState;
  /** Width and height in pixels. Passed to BotAvatar's `size`, never to CSS. */
  size?: number;
};

// docs/design.md, the robots: one body type per role.
const avatarType: Record<RobotRole, BotAvatarType> = {
  lead: "flower",
  builder: "circle",
  machine: "mech",
};

// docs/spec.md, contract 3: idle maps to the BotAvatar state "default". The
// free package has no sleeping state, so a sleeping robot shows "default"
// too (the human's decision): it stays animated, it is not paused.
const avatarState: Record<RobotState, BotAvatarState> = {
  idle: "default",
  working: "working",
  sleeping: "default",
};

// A slight hop on hover (docs/design.md, effects). The canvas overscans its
// box by half its size, so the hop has room and nothing here clips it.
const HOP: Keyframe[] = [
  { transform: "translateY(0)" },
  { transform: "translateY(-6%)", offset: 0.4 },
  { transform: "translateY(0)" },
];

function hop(event: PointerEvent<HTMLCanvasElement>) {
  const canvas = event.currentTarget;
  if (prefersReducedMotion() || typeof canvas.animate !== "function") return;
  if (canvas.getAnimations?.().some((animation) => animation.id === "robot-hop")) return;
  canvas.animate(HOP, { duration: 360, easing: "ease-out", id: "robot-hop" });
}

/** A workthos role as a plush BotAvatar (docs/design.md, the robots). */
export function Robot({ role, state, size = 96 }: RobotProps) {
  return (
    <BotAvatar
      type={avatarType[role]}
      state={avatarState[state]}
      size={size}
      shading="fabric"
      aria-label={`${role} robot, ${state}`}
      data-role={role}
      onPointerEnter={hop}
    />
  );
}
