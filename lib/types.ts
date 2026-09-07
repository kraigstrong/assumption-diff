/** Shared types. Kept in one small file so the data model is readable at a glance. */

/** Where an option sits on its dimension's spectrum. 0 = most aggressive, 3 = most conservative. */
export type Weight = 0 | 1 | 2 | 3;

export type Option = {
  id: string;
  /** Short label shown on the radio button. */
  label: string;
  /** One line of clarification so the choice is unambiguous. */
  detail: string;
  weight: Weight;
};

export type Dimension = {
  id: string;
  title: string;
  /** Human-readable ends of the axis, shown on the report. */
  spectrum: { low: string; high: string };
  /** Why this dimension is worth asking about. Shown on the report card. */
  whyItMatters: string;
  question: string;
  /** Exactly 4, ordered by ascending weight. */
  options: Option[];
  /**
   * Second-order probes keyed by option id. A probe is only ever reached when
   * both people pick that option, and the baseline picks exactly one per
   * dimension -- so in practice only the baseline's option needs one. A missing
   * entry simply means no probe is asked.
   */
  alignmentProbes: Record<string, StaticProbe>;
};

/**
 * A frozen second-order probe, asked when both people picked the same option.
 *
 * It is static precisely so both people answer the SAME question -- that is what
 * makes their answers comparable, and comparable is what lets a probe change a
 * verdict. An adaptive probe generated from one person's reasoning could only
 * ever be evidence.
 */
export type StaticProbe = {
  question: string;
  /** Exactly 3, compared by exact string like the adaptive follow-up. */
  options: string[];
};

/** An LLM-generated probe, fired only where the reviewer diverges from the baseline. */
export type FollowUp = {
  question: string;
  options: string[];
  /** The option the reviewer picked. Null while unanswered. */
  answer: string | null;
};

/** One participant's position on one dimension. */
export type Answer = {
  dimensionId: string;
  optionId: string;
  rationale: string;
  /** Adaptive probe. Reviewer only, evidence only -- never changes a verdict. */
  followUp?: FollowUp;
  /**
   * The chosen option of the static probe. Recorded for BOTH people, so it is
   * comparable and can change a verdict.
   *
   * Only the answer is stored: the question and options are looked up from
   * `dimension.alignmentProbes[optionId]`, so a recorded answer cannot drift
   * out of sync with the probe text it was given for.
   */
  probeAnswer?: string;
};

/** The LLM-written prose for a flagged dimension. */
export type Decision = {
  dimensionId: string;
  /** The concrete question someone has to answer. */
  question: string;
  /** What breaks if it goes unanswered. */
  stakes: string;
  /** The cost of each side's position. */
  ifBaseline: string;
  ifReviewer: string;
};
