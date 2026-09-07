/**
 * Model choice is deliberate, and latency-driven.
 *
 * The two runtime calls sit on the critical path of a 3-minute demo, so they
 * use fast models. Question generation runs once, offline, and every future
 * session depends on its output -- so it buys the best model available.
 *
 * These are the knobs to turn if quality or speed disappoints in the demo.
 */
export const MODELS = {
  /** scripts/generate-questions.ts -- offline, quality compounds, latency free. */
  questionGeneration: "claude-opus-5",
  /** /api/followup -- fired 2-3x mid-interview. Constrained schema, needs speed. */
  followUp: "claude-haiku-4-5",
  /** /api/report -- writes prose about a diff the code already computed. */
  report: "claude-sonnet-5",
} as const;
