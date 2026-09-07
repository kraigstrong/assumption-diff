/**
 * The deterministic core of the demo.
 *
 * Misalignment is computed here, by arithmetic, and never by the LLM. Every
 * answer option carries a weight (0-3) describing where it sits on its
 * dimension's spectrum; the distance between two participants' weights is the
 * disagreement. The LLM is handed the result of this file -- it never decides
 * what counts as misaligned.
 *
 * The report prints the weights and the subtraction so a reader can check the
 * scoring by eye.
 */
import type { Answer, Dimension, Option } from "./types";

export type Severity = "aligned" | "minor" | "misaligned";

export type Position = {
  option: Option;
  rationale: string;
};

export type DimensionDiff = {
  dimension: Dimension;
  baseline: Position;
  reviewer: Position;
  /** Absolute difference in option weights: 0..3 */
  distance: number;
  severity: Severity;
  /** The reviewer's follow-up exchange, when one was asked. */
  followUp?: Answer["followUp"];
};

/**
 * Distance to severity.
 *
 * Adjacent options are genuinely defensible variants of each other, so a
 * distance of 1 is a gap worth confirming rather than a real fight. Two or
 * more steps apart means the two people are building different products.
 */
export function severityFor(distance: number): Severity {
  if (distance === 0) return "aligned";
  if (distance === 1) return "minor";
  return "misaligned";
}

/** A follow-up is worth an LLM call only where the two sides actually diverge. */
export function shouldAskFollowUp(distance: number): boolean {
  return distance >= 1;
}

function findOption(dimension: Dimension, optionId: string): Option {
  const option = dimension.options.find((o) => o.id === optionId);
  if (!option) {
    throw new Error(
      `Unknown option "${optionId}" for dimension "${dimension.id}"`,
    );
  }
  return option;
}

function findAnswer(answers: Answer[], dimensionId: string): Answer {
  const answer = answers.find((a) => a.dimensionId === dimensionId);
  if (!answer) {
    throw new Error(`No answer recorded for dimension "${dimensionId}"`);
  }
  return answer;
}

/** Compare one dimension. Exported so a single comparison can be unit-tested. */
export function diffDimension(
  dimension: Dimension,
  baselineAnswer: Answer,
  reviewerAnswer: Answer,
): DimensionDiff {
  const baselineOption = findOption(dimension, baselineAnswer.optionId);
  const reviewerOption = findOption(dimension, reviewerAnswer.optionId);
  const distance = Math.abs(baselineOption.weight - reviewerOption.weight);

  return {
    dimension,
    baseline: { option: baselineOption, rationale: baselineAnswer.rationale },
    reviewer: { option: reviewerOption, rationale: reviewerAnswer.rationale },
    distance,
    severity: severityFor(distance),
    followUp: reviewerAnswer.followUp,
  };
}

/** Compare every dimension. Order follows the dimension list, not the answers. */
export function buildDiff(
  dimensions: Dimension[],
  baselineAnswers: Answer[],
  reviewerAnswers: Answer[],
): DimensionDiff[] {
  return dimensions.map((dimension) =>
    diffDimension(
      dimension,
      findAnswer(baselineAnswers, dimension.id),
      findAnswer(reviewerAnswers, dimension.id),
    ),
  );
}

export type Summary = {
  total: number;
  aligned: number;
  minor: number;
  misaligned: number;
  /** Dimensions needing an explicit decision before work starts. */
  needsDecision: number;
  /** One-line headline for the top of the report. */
  headline: string;
};

export function summarize(diffs: DimensionDiff[]): Summary {
  const count = (s: Severity) => diffs.filter((d) => d.severity === s).length;
  const misaligned = count("misaligned");
  const minor = count("minor");
  const needsDecision = misaligned + minor;

  // "1 of 4 dimensions needs..." -- the noun stays plural, only the verb agrees.
  const verb = (n: number) => (n === 1 ? "needs" : "need");

  let headline: string;
  if (needsDecision === 0) {
    headline = `Aligned on all ${diffs.length} dimensions.`;
  } else if (misaligned === 0) {
    headline = `${minor} of ${diffs.length} dimensions ${verb(minor)} confirming.`;
  } else {
    headline = `${misaligned} of ${diffs.length} dimensions ${verb(misaligned)} a decision.`;
  }

  return {
    total: diffs.length,
    aligned: count("aligned"),
    minor,
    misaligned,
    needsDecision,
    headline,
  };
}

/** The dimensions the LLM should write decision prose for. */
export function flaggedDiffs(diffs: DimensionDiff[]): DimensionDiff[] {
  return diffs.filter((d) => d.severity !== "aligned");
}
