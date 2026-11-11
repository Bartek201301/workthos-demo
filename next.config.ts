import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A static site: `next build` writes every page to out/.
  output: "export",
  images: { unoptimized: true },
  // Keep `next dev` from writing AGENTS.md into the repository root,
  // which is outside the lanes builders may change.
  agentRules: false,
};

export default nextConfig;
