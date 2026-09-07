import { describe, expect, it } from "vitest";
import { BASELINE_ANSWERS } from "./baseline";
import { DIMENSIONS } from "./questions";

/**
 * The question set, the baseline, and the probes are three separate fixtures
 * that refer to each other by string id. Nothing at runtime rejects a typo
 * between them -- a misspelled probe answer would simply never match the
 * reviewer's, quietly marking every agreed dimension as a deeper gap. These
 * tests are the thing that catches that.
 */
describe("fixture integrity", () => {
  it("records a baseline answer for every dimension", () => {
    for (const dimension of DIMENSIONS) {
      const answer = BASELINE_ANSWERS.find((a) => a.dimensionId === dimension.id);
      expect(answer, `no baseline answer for "${dimension.id}"`).toBeDefined();
    }
  });

  it("points every baseline answer at a real option", () => {
    for (const answer of BASELINE_ANSWERS) {
      const dimension = DIMENSIONS.find((d) => d.id === answer.dimensionId);
      const ids = dimension?.options.map((o) => o.id) ?? [];
      expect(ids, `"${answer.optionId}" is not an option of "${answer.dimensionId}"`)
        .toContain(answer.optionId);
    }
  });

  it("gives every dimension a probe for the option the baseline picked", () => {
    for (const answer of BASELINE_ANSWERS) {
      const dimension = DIMENSIONS.find((d) => d.id === answer.dimensionId)!;
      expect(
        dimension.alignmentProbes[answer.optionId],
        `"${answer.dimensionId}" has no probe for the baseline's option "${answer.optionId}", so agreement there can never be tested`,
      ).toBeDefined();
    }
  });

  it("records a baseline probe answer that is one of that probe's options", () => {
    for (const answer of BASELINE_ANSWERS) {
      const dimension = DIMENSIONS.find((d) => d.id === answer.dimensionId)!;
      const probe = dimension.alignmentProbes[answer.optionId];
      expect(answer.probeAnswer, `"${answer.dimensionId}" has no probeAnswer`).toBeDefined();
      expect(
        probe.options,
        `"${answer.probeAnswer}" is not one of the probe options for "${answer.dimensionId}"`,
      ).toContain(answer.probeAnswer);
    }
  });

  it("carries no probe for an option the baseline did not pick", () => {
    // Unreachable probes are dead weight: agreement is only possible on the
    // baseline's own option, so anything else can never be shown.
    for (const dimension of DIMENSIONS) {
      const answer = BASELINE_ANSWERS.find((a) => a.dimensionId === dimension.id)!;
      expect(Object.keys(dimension.alignmentProbes)).toEqual([answer.optionId]);
    }
  });

  it("offers exactly four weighted options per dimension, ordered 0-3", () => {
    for (const dimension of DIMENSIONS) {
      expect(dimension.options.map((o) => o.weight), dimension.id).toEqual([0, 1, 2, 3]);
    }
  });

  it("offers three options on every probe", () => {
    for (const dimension of DIMENSIONS) {
      for (const [optionId, probe] of Object.entries(dimension.alignmentProbes)) {
        expect(probe.options.length, `${dimension.id}/${optionId}`).toBe(3);
      }
    }
  });
});
