/**
 * A recorded session, used to render /sample without an API call or a session.
 *
 * CAPTURED FROM A REAL RUN on 2026-09-07 -- the adaptive follow-ups were
 * written by claude-haiku-4-5 and the decisions by claude-sonnet-5, through the
 * same routes the live report uses. Nothing here is hand-written.
 *
 * Chosen to exercise all four outcomes so /sample shows the full range:
 *   scope   -- two steps apart                      -> Misaligned
 *   shared  -- SAME option, split on the probe       -> Deeper gap
 *   timing  -- same option and same probe answer     -> Aligned
 *   legal   -- one step apart                        -> Minor gap
 *
 * `probeAnswer` on shared and timing is the static second-order probe, which is
 * what the scoring compares. `followUp` on scope and legal is the adaptive
 * probe, which is evidence for the report and never changes a verdict.
 *
 * Only the reviewer's answers and the decision text are stored. The diff is
 * recomputed by lib/diff.ts at render time, so the sample cannot show scoring
 * that a real run would not produce.
 *
 * To re-capture, see README "Regenerating the sample report".
 */
import type { Answer, Decision } from "./types";

export const SAMPLE_ANSWERS: Answer[] = [
  {
    dimensionId: "scope",
    optionId: "anonymize",
    rationale:
      "Hard delete breaks every foreign key we have. Anonymizing gets the same user-facing outcome without a migration.",
    followUp: {
      question:
        "If a deleted account remains as an anonymous placeholder, can customers prove to auditors that personal data is genuinely gone?",
      options: [
        "Yes, we document anonymization meets compliance standards",
        "No, we'll need to explain retained data structure",
        "Unclear, depends on which regulations apply to us",
      ],
      answer: "No, we'll need to explain retained data structure",
    },
  },
  {
    dimensionId: "shared",
    optionId: "tombstone",
    rationale: "Threads have to stay readable. Taking the name off is enough.",
    probeAnswer: "Only the author label changes; the text stays as written",
  },
  {
    dimensionId: "timing",
    optionId: "recovery-window",
    rationale:
      "Thirty days is worth the restore path. People delete angry and come back.",
    probeAnswer: "Gone immediately, as if the deletion were already final",
  },
  {
    dimensionId: "legal",
    optionId: "broad-hold",
    rationale: "I'd rather keep the audit trail than explain its absence.",
    followUp: {
      question:
        "If a deleted user sues you and discovers their full audit trail survived deletion, how do you explain deletion was genuine to the court?",
      options: [
        "We document the compliance hold in the deletion confirmation email",
        "We accept the legal risk to preserve audit integrity",
        "We delete audit logs but keep transaction records only",
      ],
      answer: "We accept the legal risk to preserve audit integrity",
    },
  },
];

export const SAMPLE_DECISIONS: Decision[] = [
  {
    dimensionId: "scope",
    question:
      "Should account deletion physically remove user rows (hard delete) or anonymize them in place?",
    stakes:
      "Choosing wrong means either a costly schema migration later or a failed audit when auditors find retained personal data structures.",
    ifBaseline:
      "Hard delete requires reworking every foreign key referencing users, risking broken records and app errors.",
    ifReviewer:
      "Anonymizing leaves data structures behind that we must explain to auditors, weakening our 'data is gone' claim.",
  },
  {
    dimensionId: "shared",
    question:
      "When a user is deleted, do we scrub their name from @mentions and signed comments workspace-wide, or only replace the author label?",
    stakes:
      "Unresolved, engineering can't build the deletion job since it doesn't know how deep the redaction needs to go.",
    ifBaseline:
      "Scrubbing text everywhere requires scanning and rewriting historical content, risking broken context or missed references.",
    ifReviewer:
      "Leaving names in old text means the person isn't truly erased from conversations, undercutting the deletion promise.",
  },
  {
    dimensionId: "legal",
    question:
      "Should we retain only legally mandated records after deletion, or keep a broader compliance hold on all activity?",
    stakes:
      "Without agreement, legal exposure or audit failure risk stays undefined and support can't answer customer questions about what's kept.",
    ifBaseline:
      "Keeping only what's legally required means less protection if disputes arise needing historical activity records.",
    ifReviewer:
      "A broad compliance hold keeps data we claimed to delete, creating legal risk if a user proves it survived.",
  },
];
