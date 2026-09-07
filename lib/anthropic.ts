import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export { MODELS } from "./models";

/**
 * Returns null when no API key is configured, so callers degrade gracefully
 * instead of throwing. The demo must survive a missing key.
 */
export function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}
