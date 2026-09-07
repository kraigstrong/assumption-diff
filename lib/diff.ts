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

export type Severity = "aligned" | "deeper" | "minor" | "misaligned";

export type Position = {
  option: Option;
  rationale: string;
};

/** The second-order exchange, when both sides answered the same static probe. */
export type ProbeComparison = {
  question: string;
  baselineAnswer: string;
  reviewerAnswer: string;
  agreed: boolean;
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
  /** Present only when both people answered the dimension's static probe. */
  probe?: ProbeComparison;
  /**
   * What the decision is actually between. For a first-order gap that is the
   * two chosen options; for a second-order gap it is the two probe answers.
   * Null when there is nothing to decide.
   */
  contested: { a: string; b: string } | null;
};

/**
 * First-order distance to severity.
 *
 * Adjacent options are genuinely defensible variants of each other, so a
 * distance of 1 is a gap worth confirming rather than a real fight. Two or
 * more steps apart means the two people are building different products.
 *
 * A distance of 0 is only provisionally aligned -- the static probe can still
 * upgrade it to "deeper". See `diffDimension`.
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

  let severity = severityFor(distance);
  let contested: DimensionDiff["contested"] =
    distance === 0
      ? null
      : { a: baselineOption.label, b: reviewerOption.label };

  // Second order. Two people can pick the same option and still mean different
  // things by it; the static probe is what catches that. It only applies where
  // they agreed on the surface -- past that point the disagreement is already
  // visible and the probe would have nothing to add.
  let probe: ProbeComparison | undefined;
  const staticProbe = dimension.alignmentProbes[baselineOption.id];

  if (
    distance === 0 &&
    staticProbe &&
    baselineAnswer.probeAnswer &&
    reviewerAnswer.probeAnswer
  ) {
    const agreed = baselineAnswer.probeAnswer === reviewerAnswer.probeAnswer;
    probe = {
      question: staticProbe.question,
      baselineAnswer: baselineAnswer.probeAnswer,
      reviewerAnswer: reviewerAnswer.probeAnswer,
      agreed,
    };

    if (!agreed) {
      severity = "deeper";
      contested = {
        a: baselineAnswer.probeAnswer,
        b: reviewerAnswer.probeAnswer,
      };
    }
  }

  return {
    dimension,
    baseline: { option: baselineOption, rationale: baselineAnswer.rationale },
    reviewer: { option: reviewerOption, rationale: reviewerAnswer.rationale },
    distance,
    severity,
    followUp: reviewerAnswer.followUp,
    probe,
    contested,
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
  /** Same option, different answer to the second-order probe. */
  deeper: number;
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
  const deeper = count("deeper");
  const needsDecision = misaligned + minor + deeper;

  // Every gap needs settling before work starts -- a one-step gap is a smaller
  // disagreement, not a skippable one. So the headline counts every dimension
  // that is not aligned, which is exactly the set that gets a decision block.
  // "1 of 4 dimensions needs..." -- the noun stays plural, only the verb agrees.
  const verb = needsDecision === 1 ? "needs" : "need";

  const headline =
    needsDecision === 0
      ? `Aligned on all ${diffs.length} dimensions.`
      : `${needsDecision} of ${diffs.length} dimensions ${verb} a decision.`;

  return {
    total: diffs.length,
    aligned: count("aligned"),
    deeper,
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
