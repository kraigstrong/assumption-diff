/**
 * Person A: the Product lead who wrote the PRD.
 *
 * Recorded once and committed, so every reviewer diffs against the same
 * positions and the demo is reproducible. Rationales are written in the voice
 * of someone thinking about users and trust, not about schemas -- which is
 * exactly where the gaps with an engineer come from.
 */
import type { Answer } from "./types";

export const BASELINE_ROLE = "Product";
export const BASELINE_NAME = "Kraig";

export const BASELINE_ANSWERS: Answer[] = [
  {
    dimensionId: "scope",
    optionId: "hard-delete",
    rationale:
      "If we tell someone we deleted their data, it needs to be gone. Anything short of that becomes a trust story the first time it leaks.",
  },
  {
    dimensionId: "shared",
    optionId: "tombstone",
    rationale:
      "Their teammates shouldn't lose the thread of a conversation because one person left. But the name has to come off it.",
  },
  {
    dimensionId: "timing",
    optionId: "recovery-window",
    rationale:
      "People delete accounts when they're angry and regret it two days later. A recovery window saves them their data and saves us the tickets.",
  },
  {
    dimensionId: "legal",
    optionId: "strict-minimum",
    rationale:
      "Keep the invoices because we're required to. Everything else goes -- I don't want us inventing reasons to hold onto things.",
  },
];
