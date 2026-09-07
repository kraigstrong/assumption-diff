import { describe, expect, it } from "vitest";
import {
  buildDiff,
  diffDimension,
  flaggedDiffs,
  severityFor,
  shouldAskFollowUp,
  summarize,
} from "./diff";
import type { Answer, Dimension } from "./types";

/** A miniature dimension with the same 0-3 shape as the real ones. */
function dimension(id: string): Dimension {
  return {
    id,
    title: `Dimension ${id}`,
    spectrum: { low: "aggressive", high: "conservative" },
    whyItMatters: "because",
    question: "Which?",
    options: [
      { id: "a", label: "A", detail: "", weight: 0 },
      { id: "b", label: "B", detail: "", weight: 1 },
      { id: "c", label: "C", detail: "", weight: 2 },
      { id: "d", label: "D", detail: "", weight: 3 },
    ],
    // Only option "a" carries a probe, mirroring the real fixtures where only
    // the baseline's option is ever reachable.
    alignmentProbes: {
      a: { question: "But how far?", options: ["all", "some", "none"] },
    },
  };
}

/** An answer that also answered the static probe. */
function probed(dimensionId: string, optionId: string, probeAnswer: string): Answer {
  return { dimensionId, optionId, rationale: "", probeAnswer };
}

function answer(dimensionId: string, optionId: string): Answer {
  return { dimensionId, optionId, rationale: "" };
}

describe("severityFor", () => {
  it("treats an identical choice as aligned", () => {
    expect(severityFor(0)).toBe("aligned");
  });

  it("treats one step apart as a minor gap, not a fight", () => {
    expect(severityFor(1)).toBe("minor");
  });

  it("treats two or more steps apart as misaligned", () => {
    expect(severityFor(2)).toBe("misaligned");
    expect(severityFor(3)).toBe("misaligned");
  });
});

describe("shouldAskFollowUp", () => {
  it("skips the LLM call when both sides agree", () => {
    expect(shouldAskFollowUp(0)).toBe(false);
  });

  it("probes as soon as there is any divergence", () => {
    expect(shouldAskFollowUp(1)).toBe(true);
    expect(shouldAskFollowUp(3)).toBe(true);
  });
});

describe("diffDimension", () => {
  const d = dimension("scope");

  it("computes distance as an absolute difference, regardless of direction", () => {
    const forward = diffDimension(d, answer("scope", "a"), answer("scope", "d"));
    const backward = diffDimension(d, answer("scope", "d"), answer("scope", "a"));
    expect(forward.distance).toBe(3);
    expect(backward.distance).toBe(3);
  });

  it("keeps each side's chosen option on the right side of the diff", () => {
    const result = diffDimension(d, answer("scope", "a"), answer("scope", "c"));
    expect(result.baseline.option.id).toBe("a");
    expect(result.reviewer.option.id).toBe("c");
    expect(result.distance).toBe(2);
    expect(result.severity).toBe("misaligned");
  });

  it("carries the reviewer's follow-up through, not the baseline's", () => {
    const reviewer: Answer = {
      ...answer("scope", "c"),
      followUp: { question: "Q", options: ["x"], answer: "x" },
    };
    const result = diffDimension(d, answer("scope", "a"), reviewer);
    expect(result.followUp?.answer).toBe("x");
  });

  it("throws loudly on an unknown option rather than scoring silently wrong", () => {
    expect(() =>
      diffDimension(d, answer("scope", "a"), answer("scope", "nope")),
    ).toThrow(/Unknown option/);
  });
});

describe("buildDiff", () => {
  const dimensions = [dimension("one"), dimension("two")];

  it("follows dimension order, not the order answers were given", () => {
    const baseline = [answer("one", "a"), answer("two", "a")];
    const reviewer = [answer("two", "d"), answer("one", "b")];
    const diffs = buildDiff(dimensions, baseline, reviewer);
    expect(diffs.map((d) => d.dimension.id)).toEqual(["one", "two"]);
    expect(diffs[0].distance).toBe(1);
    expect(diffs[1].distance).toBe(3);
  });

  it("throws when a dimension has no recorded answer", () => {
    expect(() =>
      buildDiff(dimensions, [answer("one", "a")], [answer("one", "a")]),
    ).toThrow(/No answer recorded/);
  });
});

describe("summarize", () => {
  const dimensions = [dimension("1"), dimension("2"), dimension("3"), dimension("4")];

  function summaryFor(pairs: [string, string][]) {
    const baseline = pairs.map(([b], i) => answer(String(i + 1), b));
    const reviewer = pairs.map(([, r], i) => answer(String(i + 1), r));
    return summarize(buildDiff(dimensions, baseline, reviewer));
  }

  it("reports full alignment when every answer matches", () => {
    const s = summaryFor([["a", "a"], ["b", "b"], ["c", "c"], ["d", "d"]]);
    expect(s.aligned).toBe(4);
    expect(s.needsDecision).toBe(0);
    expect(s.headline).toBe("Aligned on all 4 dimensions.");
  });

  it("counts every gap in the headline, not just the wide ones", () => {
    const s = summaryFor([["a", "d"], ["a", "c"], ["b", "b"], ["c", "d"]]);
    expect(s.misaligned).toBe(2);
    expect(s.minor).toBe(1);
    expect(s.aligned).toBe(1);
    // 2 misaligned + 1 minor: all three get a decision block, so all three count.
    expect(s.needsDecision).toBe(3);
    expect(s.headline).toBe("3 of 4 dimensions need a decision.");
  });

  it("still says a decision is needed when every gap is only one step", () => {
    const s = summaryFor([["a", "b"], ["b", "b"], ["c", "c"], ["d", "d"]]);
    expect(s.misaligned).toBe(0);
    expect(s.needsDecision).toBe(1);
    expect(s.headline).toBe("1 of 4 dimensions needs a decision.");
  });
});

describe("flaggedDiffs", () => {
  it("hands the LLM only the dimensions that are not aligned", () => {
    const dimensions = [dimension("1"), dimension("2"), dimension("3")];
    const diffs = buildDiff(
      dimensions,
      [answer("1", "a"), answer("2", "a"), answer("3", "a")],
      [answer("1", "a"), answer("2", "b"), answer("3", "d")],
    );
    expect(flaggedDiffs(diffs).map((d) => d.dimension.id)).toEqual(["2", "3"]);
  });
});

describe("second-order probes", () => {
  const d = dimension("scope");

  it("stays aligned when both give the same probe answer", () => {
    const result = diffDimension(d, probed("scope", "a", "all"), probed("scope", "a", "all"));
    expect(result.severity).toBe("aligned");
    expect(result.probe?.agreed).toBe(true);
    expect(result.contested).toBeNull();
  });

  it("upgrades to a deeper gap when the probe answers differ", () => {
    const result = diffDimension(d, probed("scope", "a", "all"), probed("scope", "a", "none"));
    expect(result.severity).toBe("deeper");
    expect(result.distance).toBe(0);
    expect(result.probe?.agreed).toBe(false);
  });

  it("contests the probe answers, not the shared option", () => {
    const result = diffDimension(d, probed("scope", "a", "all"), probed("scope", "a", "none"));
    expect(result.contested).toEqual({ a: "all", b: "none" });
  });

  it("contests the two options when the gap is first-order", () => {
    const result = diffDimension(d, answer("scope", "a"), answer("scope", "c"));
    expect(result.contested).toEqual({ a: "A", b: "C" });
  });

  it("ignores the probe once the two already disagree on the surface", () => {
    // A probe answer recorded against a different option must not leak into a
    // first-order comparison.
    const result = diffDimension(
      d,
      probed("scope", "a", "all"),
      probed("scope", "b", "none"),
    );
    expect(result.severity).toBe("minor");
    expect(result.probe).toBeUndefined();
  });

  it("stays aligned when the dimension has no probe for that option", () => {
    const result = diffDimension(d, probed("scope", "d", "all"), probed("scope", "d", "none"));
    expect(result.severity).toBe("aligned");
    expect(result.probe).toBeUndefined();
  });

  it("stays aligned when one side never answered the probe", () => {
    const result = diffDimension(d, probed("scope", "a", "all"), answer("scope", "a"));
    expect(result.severity).toBe("aligned");
    expect(result.probe).toBeUndefined();
  });
});

describe("deeper gaps in the summary", () => {
  const dimensions = [dimension("1"), dimension("2")];

  it("counts a deeper gap as needing a decision", () => {
    const diffs = buildDiff(
      dimensions,
      [probed("1", "a", "all"), probed("2", "a", "all")],
      [probed("1", "a", "none"), probed("2", "a", "all")],
    );
    const s = summarize(diffs);
    expect(s.deeper).toBe(1);
    expect(s.aligned).toBe(1);
    expect(s.needsDecision).toBe(1);
    expect(s.headline).toBe("1 of 2 dimensions needs a decision.");
  });

  it("sends deeper gaps to the model for a decision", () => {
    const diffs = buildDiff(
      dimensions,
      [probed("1", "a", "all"), probed("2", "a", "all")],
      [probed("1", "a", "none"), probed("2", "a", "all")],
    );
    expect(flaggedDiffs(diffs).map((x) => x.dimension.id)).toEqual(["1"]);
  });
});
