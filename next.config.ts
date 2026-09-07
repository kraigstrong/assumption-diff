import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` otherwise appends its own guidance block to AGENTS.md on every
  // run. That file is the review brief for this project and is deliberately
  // short, so keep it ours.
  agentRules: false,
  /* config options here */
};

export default nextConfig;
