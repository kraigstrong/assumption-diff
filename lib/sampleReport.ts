/**
 * A recorded session, used to render /sample without an API call or a session.
 *
 * CAPTURED FROM A REAL RUN on 2026-09-07 -- the follow-up questions were
 * written by claude-haiku-4-5 and the decisions by claude-sonnet-5, through
 * the same routes the live report uses. Nothing here is hand-written.
 *
 * Chosen to exercise all three outcomes so /sample shows the full range:
 *   scope   -- two steps apart  -> Misaligned
 *   shared  -- two steps apart  -> Misaligned
 *   timing  -- same answer      -> Aligned, and no follow-up was asked
 *   legal   -- one step apart   -> Minor gap
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
        "If a user deletes their account, then resubscribes with the same email, will they see their old anonymized activity history?",
      options: [
        "Yes, linked by email, historical context visible",
        "No, completely separate new account created",
        "Unclear until we test the re-signup flow",
      ],
      answer: "No, completely separate new account created",
    },
  },
  {
    dimensionId: "shared",
    optionId: "workspace-owns",
    rationale:
      "Those comments are on documents the team paid for. Removing them is destroying other people's data.",
    followUp: {
      question:
        "If a deleted user's comments remain visible, how do you prevent those comments from becoming a compliance liability when the user's personal data should have been removed?",
      options: [
        "Anonymize the comment author but keep text intact",
        "Delete comments only, preserve document edit history",
        "Accept that some personal data will persist",
      ],
      answer: "Accept that some personal data will persist",
    },
  },
  {
    dimensionId: "timing",
    optionId: "recovery-window",
    rationale:
      "Agreed — 30 days is worth the restore path. People delete angry and come back.",
  },
  {
    dimensionId: "legal",
    optionId: "broad-hold",
    rationale:
      "I'd rather keep the audit trail. If we're asked what happened to an account, “we deleted it” isn't an answer.",
    followUp: {
      question:
        "If regulators request user data after deletion, does your legal team pre-approve which retained records you will actually disclose?",
      options: [
        "Yes, we have written guidance on disclosure scope",
        "No, we decide case-by-case when asked",
        "We retain data but assume we cannot share it",
      ],
      answer: "No, we decide case-by-case when asked",
    },
  },
];

export const SAMPLE_DECISIONS: Decision[] = [
  {
    dimensionId: "scope",
    question: "Do we hard-delete user rows or anonymize them in place?",
    stakes:
      "Foreign key integrity vs. genuine data erasure — pick wrong and either the app breaks or a leak becomes a lawsuit.",
    ifBaseline:
      "Hard delete requires rebuilding every dependent table's foreign key handling before launch.",
    ifReviewer:
      "Anonymizing leaves real personal data in the database, undermining any claim that deletion actually happened.",
  },
  {
    dimensionId: "shared",
    question:
      "Do we scrub deleted users' names from shared comments, or leave shared content completely untouched?",
    stakes:
      "Determines whether a deleted user's personal data can keep surfacing in teammates' workspaces after they've left.",
    ifBaseline:
      'Attributing edits to "[deleted user]" still keeps their comment text stored and visible indefinitely.',
    ifReviewer:
      "Leaving content untouched means the user's name and words persist in the product after deletion, unresolved for compliance.",
  },
  {
    dimensionId: "legal",
    question:
      "Do we retain only legally mandated records, or keep a broad compliance hold on deleted accounts?",
    stakes:
      "Decides whether audits get answers or the company holds data it can't justify keeping.",
    ifBaseline:
      "Minimal retention means we may have no record at all if asked what happened to an account.",
    ifReviewer:
      "A broad hold means we're storing more personal data than required, contradicting the deletion promise made to users.",
  },
];
