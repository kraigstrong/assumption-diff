/**
 * The interview question set.
 *
 * FIXTURE -- frozen on purpose. The baseline answers in `lib/baseline.ts`
 * reference these option ids, so regenerating this file at runtime would let
 * the two drift apart and make every comparison meaningless. Regenerate only
 * via `npm run generate:questions`, review the diff, and re-check the baseline.
 *
 * Options are ordered by ascending weight (0 = most aggressive, 3 = most
 * conservative). Adjacent options are deliberately both defensible -- that is
 * what makes a distance of 2+ a real disagreement rather than a wording quirk.
 */
import type { Dimension } from "./types";

export const DIMENSIONS: Dimension[] = [
  {
    id: "scope",
    title: "Deletion Scope",
    spectrum: { low: "Erase everything", high: "Keep everything, hidden" },
    whyItMatters:
      "“Removed” can mean four different schemas. Engineering commits to one in week one, and changing it later is a data migration, not a config flag.",
    question:
      "The PRD says the user’s data “should be removed.” When a deletion finishes, what has actually happened in the primary database?",
    options: [
      {
        id: "hard-delete",
        label: "Hard delete — the rows are gone",
        detail:
          "Records are physically removed. Nothing is recoverable, including by us.",
        weight: 0,
      },
      {
        id: "purge-pii",
        label: "Purge personal fields, keep the record",
        detail:
          "The row survives with a stable id, but name, email, and every identifying field are overwritten.",
        weight: 1,
      },
      {
        id: "anonymize",
        label: "Anonymize in place",
        detail:
          "The account becomes an unnamed placeholder so history, counts, and aggregates stay intact.",
        weight: 2,
      },
      {
        id: "soft-delete",
        label: "Soft delete — flag it inactive",
        detail:
          "Data stays as-is, hidden from the product, restorable by an engineer.",
        weight: 3,
      },
    ],
  },
  {
    id: "shared",
    title: "Shared Data",
    spectrum: { low: "The person owns it", high: "The workspace owns it" },
    whyItMatters:
      "This is the decision that produces angry tickets from people who never asked for anything to be deleted.",
    question:
      "The user has left comments on their team’s shared documents. Their teammates still work in those documents every day. What happens to the comments?",
    options: [
      {
        id: "remove-everywhere",
        label: "Delete them along with the account",
        detail:
          "Comments disappear from the shared docs. Threads may lose their context.",
        weight: 0,
      },
      {
        id: "tombstone",
        label: "Keep the text, show “[deleted user]”",
        detail:
          "Threads stay readable and coherent; the author becomes an anonymous tombstone.",
        weight: 1,
      },
      {
        id: "keep-strip-link",
        label: "Keep them, sever the link to the person",
        detail:
          "Content and display name remain as historical record; only the connection to the deleted account is broken.",
        weight: 2,
      },
      {
        id: "workspace-owns",
        label: "Leave them untouched",
        detail:
          "Content created inside a team workspace belongs to the workspace, and deletion does not reach it.",
        weight: 3,
      },
    ],
  },
  {
    id: "timing",
    title: "Timing & Reversibility",
    spectrum: { low: "Final on click", high: "Always recoverable" },
    whyItMatters:
      "An immediate purge and a 30-day recovery window are different systems, not different settings. Picking late means rebuilding.",
    question:
      "The user clicks “Delete my account” and confirms the dialog. At what point is that decision final?",
    options: [
      {
        id: "immediate",
        label: "Immediately and irreversibly",
        detail:
          "Deletion executes on confirm. There is no undo and support cannot reverse it.",
        weight: 0,
      },
      {
        id: "cooling-off",
        label: "After a short cooling-off period",
        detail:
          "Roughly 24–72 hours, during which signing back in cancels the deletion.",
        weight: 1,
      },
      {
        id: "recovery-window",
        label: "After a 30-day recovery window",
        detail:
          "The account is hidden immediately but fully restorable for 30 days, then purged.",
        weight: 2,
      },
      {
        id: "always-restorable",
        label: "Never fully final — support can always restore",
        detail:
          "Data is retained indefinitely in a deactivated state so any account can be brought back.",
        weight: 3,
      },
    ],
  },
  {
    id: "legal",
    title: "Legal Retention",
    spectrum: { low: "Deletion wins", high: "Retention wins" },
    whyItMatters:
      "The only option on this list that can turn a product feature into a legal problem.",
    question:
      "Finance and security hold records tied to this user — invoices, audit logs, fraud signals. What survives the deletion?",
    options: [
      {
        id: "nothing-survives",
        label: "Nothing — deletion means deletion",
        detail:
          "Every trace goes, invoices and audit logs included. Compliance adapts to the product.",
        weight: 0,
      },
      {
        id: "strict-minimum",
        label: "Only what law strictly requires",
        detail:
          "A minimal set — invoices, tax records, fraud signals — held for the mandated period and nothing more.",
        weight: 1,
      },
      {
        id: "broad-hold",
        label: "A broad compliance hold",
        detail:
          "Financial, security, and audit history are retained by default because proving what happened matters more.",
        weight: 2,
      },
      {
        id: "retain-by-default",
        label: "Retain unless legally compelled to delete",
        detail:
          "Retention is the default; we remove data only when a specific legal request requires it.",
        weight: 3,
      },
    ],
  },
];

export function dimensionById(id: string): Dimension | undefined {
  return DIMENSIONS.find((d) => d.id === id);
}
