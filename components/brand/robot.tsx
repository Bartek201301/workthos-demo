import type { BotAvatarState } from "bot-avatars";

export type RobotRole = "lead" | "builder" | "machine";
export type RobotState = "idle" | "working" | "sleeping";

export type RobotProps = {
  role: RobotRole;
  state: RobotState;
  /** Width and height in pixels. */
  size?: number;
};

// docs/spec.md, contract 3: idle maps to the BotAvatar state "default".
const avatarState: Record<RobotState, BotAvatarState> = {
  idle: "default",
  working: "working",
  sleeping: "sleeping",
};

/** Placeholder: the brand task replaces the inside with a BotAvatar (docs/design.md, the robots). */
export function Robot({ role, state, size = 96 }: RobotProps) {
  return (
    <span
      role="img"
      aria-label={`${role} robot, ${state}`}
      data-role={role}
      data-state={avatarState[state]}
      className="inline-flex shrink-0 items-center justify-center rounded-pill border-2 border-dashed border-sand-200 bg-sand-100 text-xs font-semibold text-ink-soft uppercase"
      style={{ width: size, height: size }}
    >
      {role}
    </span>
  );
}
