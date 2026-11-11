// Every package the later tasks use is installed now, once (issue 3,
// criterion 3), and exports what docs/spec.md says they will use.
import { describe, expect, it } from "vitest";

describe("dependencies of the later tasks", () => {
  it.each([
    ["bot-avatars", "BotAvatar"],
    ["liquid-gooey", "Liquid"],
    ["border-beam", "BorderBeam"],
    ["motion/react", "motion"],
    ["recharts", "ResponsiveContainer"],
  ])("%s exports %s", async (name, exported) => {
    const mod: Record<string, unknown> = await import(/* @vite-ignore */ name);
    expect(mod[exported]).toBeDefined();
  });

  it.each([
    ["components/ui/button", "Button"],
    ["components/ui/card", "Card"],
    ["components/ui/chart", "ChartContainer"],
    ["components/ui/table", "Table"],
    ["components/ui/toggle-group", "ToggleGroup"],
    ["components/ui/accordion", "Accordion"],
    ["components/ui/badge", "Badge"],
    ["components/ui/separator", "Separator"],
    ["components/vendor/Grainient", "default"],
  ])("@/%s exports %s", async (file, exported) => {
    const mod: Record<string, unknown> = await import(/* @vite-ignore */ `@/${file}`);
    expect(mod[exported]).toBeDefined();
  });
});
