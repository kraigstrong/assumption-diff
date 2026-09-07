/**
 * A recorded session, used to render /sample without an API call or a session.
 *
 * Only the reviewer's answers and the model's decision text are stored here --
 * the diff itself is recomputed by lib/diff.ts at render time, so the sample
 * cannot show scoring that differs from a real run.
 *
 * PROVISIONAL: replace with a genuine captured run once the API key is
 * available. See README "Regenerating the sample".
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
        "Anonymized rows keep their foreign keys. If a support agent searches the old email, what should they find?",
      options: [
        "Nothing at all",
        "An anonymized placeholder record",
        "The original record, flagged deleted",
      ],
      answer: "An anonymized placeholder record",
    },
  },
  {
    dimensionId: "shared",
    optionId: "workspace-owns",
    rationale:
      "Those comments are on documents the team paid for. Removing them is destroying other people's data.",
    followUp: {
      question:
        "If the departing user wrote something they now regret, who can take it down?",
      options: [
        "Only the workspace admin",
        "Nobody — it is permanent",
        "The user, before they delete",
      ],
      answer: "Only the workspace admin",
    },
  },
  {
    dimensionId: "timing",
    optionId: "cooling-off",
    rationale:
      "72 hours is a cron job. Thirty days means building a restore path and keeping the data hot.",
    followUp: {
      question:
        "During the cooling-off window, can the user still sign in and use the product normally?",
      options: ["Yes, fully", "Sign-in only, to cancel", "No, the account is locked"],
      answer: "Sign-in only, to cancel",
    },
  },
  {
    dimensionId: "legal",
    optionId: "broad-hold",
    rationale:
      "I would rather keep the audit trail. If we are asked what happened to an account, “we deleted it” is not an answer.",
    followUp: {
      question: "How long should the audit trail outlive the account itself?",
      options: ["12 months", "Same as invoices — 7 years", "Indefinitely"],
      answer: "Same as invoices — 7 years",
    },
  },
];

export const SAMPLE_DECISIONS: Decision[] = [
  {
    dimensionId: "scope",
    question:
      "Does “deleted” mean the row is gone, or only that it can no longer identify anyone?",
    stakes:
      "Engineering picks a schema this week, and reversing an anonymize-in-place design later is a full data migration.",
    ifBaseline:
      "Hard delete means rewriting every foreign key and losing the historical counts finance reports on.",
    ifReviewer:
      "Anonymized rows keep the user's record on disk, which is not what the deletion email promises them.",
  },
  {
    dimensionId: "shared",
    question:
      "Does a departing user's comment belong to them, or to the workspace that paid for the document?",
    stakes:
      "Either a team loses context it depends on, or a deletion request is only partly honored. There is no option that avoids both.",
    ifBaseline:
      "Threads lose their replies, and the admins who kept paying file the support tickets.",
    ifReviewer:
      "The user is told their data was deleted while their words stay visible to their old team.",
  },
  {
    dimensionId: "timing",
    question:
      "How long is the recovery window, and can the account be used during it?",
    stakes:
      "A 72-hour cron and a 30-day restore path are different systems — building the wrong one costs the sprint.",
    ifBaseline:
      "Thirty days of hot, restorable, still-secured data to build and staff.",
    ifReviewer:
      "A user who regrets it on day four has no way back, and support has nothing to offer.",
  },
  {
    dimensionId: "legal",
    question:
      "Which specific records survive a deletion, and for exactly how long?",
    stakes:
      "Without a named list, engineering guesses, and the compliance audit finds the gap instead of us.",
    ifBaseline:
      "Dropping security logs means being unable to answer what happened to a disputed account.",
    ifReviewer:
      "Retaining audit history by default keeps data the deletion promise never carved out.",
  },
];
