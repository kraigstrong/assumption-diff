/**
 * A recorded session, used to render /sample without an API call or a session.
 *
 * CAPTURED FROM A REAL RUN on 2026-09-07 -- the follow-up questions were
 * written by claude-haiku-4-5 and the decisions by claude-sonnet-5, through the same
 * routes the live report uses. Nothing here is hand-written.
 *
 * Only the reviewer's answers and the model's decision text are stored. The
 * diff itself is recomputed by lib/diff.ts at render time, so the sample
 * cannot show scoring that a real run would not produce.
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
        "If a deleted user's anonymized data still appears in activity logs and reports, does that satisfy your enterprise prospects' security expectations?",
      options: [
        "Yes, anonymization alone meets their requirements.",
        "No, we need to purge deleted user data entirely.",
        "Uncertain—we should confirm during security review.",
      ],
      answer: "Yes, anonymization alone meets their requirements.",
    },
  },
  {
    dimensionId: "shared",
    optionId: "workspace-owns",
    rationale:
      "Those comments are on documents the team paid for. Removing them is destroying other people's data.",
    followUp: {
      question:
        "If a deleted user's comment stays visible but their profile is gone, can teammates still contact them about the feedback?",
      options: [
        "Yes, teammates can reply and they'll receive notifications",
        "No, replies go nowhere since the account is deleted",
        "Unclear what happens with notifications to deleted accounts",
      ],
      answer: "No, replies go nowhere since the account is deleted",
    },
  },
  {
    dimensionId: "timing",
    optionId: "cooling-off",
    rationale:
      "72 hours is a cron job. Thirty days means building a restore path and keeping the data hot.",
    followUp: {
      question:
        "If a user re-authenticates and cancels deletion during the cooling-off window, do they lose any data created or modified after they initiated delete?",
      options: [
        "Yes, those changes are discarded permanently",
        "No, all changes are preserved intact",
        "Changes are preserved but marked separately",
      ],
      answer: "No, all changes are preserved intact",
    },
  },
  {
    dimensionId: "legal",
    optionId: "broad-hold",
    rationale:
      "I'd rather keep the audit trail. If we're asked what happened to an account, “we deleted it” isn't an answer.",
    followUp: {
      question:
        "If a user deletes their account but your audit logs prove they committed fraud, who owns the legal risk of that retained data?",
      options: [
        "Your company alone, regardless of local privacy law",
        "The user, since they chose deletion",
        "Shared between company and user depending on jurisdiction",
      ],
      answer: "Shared between company and user depending on jurisdiction",
    },
  },
];

export const SAMPLE_DECISIONS: Decision[] = [
  {
    dimensionId: "scope",
    question:
      "Should deletion be a true hard delete of database rows, or anonymization that leaves data structurally intact?",
    stakes:
      "Enterprise security reviewers may reject anonymization as fake deletion, killing deals or failing the compliance audit.",
    ifBaseline:
      "Hard delete requires reworking every foreign key relationship, a bigger migration before launch.",
    ifReviewer:
      "Anonymization ships faster but leaves recoverable data in logs/reports that may not satisfy security reviewers.",
  },
  {
    dimensionId: "shared",
    question:
      "Do a deleted user's comments on shared docs get scrubbed of name only, or left completely untouched?",
    stakes:
      "Teammates may try to reply to feedback from someone whose account no longer exists, hitting a dead end either way.",
    ifBaseline:
      "Stripping the name preserves conversation flow but still requires touching other people's shared documents.",
    ifReviewer:
      "Leaving it untouched avoids destroying team data but leaves a named identity behind that the user asked to erase.",
  },
  {
    dimensionId: "timing",
    question:
      "Is the recovery window 72 hours (simple cron) or 30 days (requires a restore path and hot storage)?",
    stakes:
      "Support ticket volume and engineering build time both hinge on this; wrong choice rebuilds the recovery system later.",
    ifBaseline:
      "30 days keeps angry-deleters' data recoverable but means building and maintaining a restore path and hot storage.",
    ifReviewer:
      "72 hours is cheap to build but many regretful users will miss the window and lose everything.",
  },
  {
    dimensionId: "legal",
    question:
      "Does retention only keep what law strictly requires, or keep a broad audit trail for all deleted accounts?",
    stakes:
      "Without agreement, legal exposure or user trust breaks depending on whether fraud investigations later need data that was purged.",
    ifBaseline:
      "Minimal retention respects user privacy but leaves no audit trail if fraud or disputes surface later.",
    ifReviewer:
      "Broad retention protects against legal risk but contradicts the 'your data is deleted' promise made to users.",
  },
];
