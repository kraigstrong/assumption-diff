import type { Decision } from "./types";

/**
 * Is this a decision for every flagged dimension, exactly once?
 *
 * The model is asked for one entry per flagged dimension. If it returns a short
 * list, or repeats an id, the dimensions it missed would render an empty gap
 * where the most important content on the page belongs -- no decision and no
 * explanation. Callers use this to fall back to the visible "unavailable"
 * notice instead of failing silently.
 */
export function coversEveryDimension(
  flaggedIds: string[],
  decisions: Pick<Decision, "dimensionId">[],
): boolean {
  const returned = new Set(decisions.map((d) => d.dimensionId));
  return (
    returned.size === decisions.length &&
    returned.size === flaggedIds.length &&
    flaggedIds.every((id) => returned.has(id))
  );
}
