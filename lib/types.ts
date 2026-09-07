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
  followUp?: FollowUp;
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
