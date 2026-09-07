import { describe, expect, it } from "vitest";
import { coversEveryDimension } from "./decisions";

const d = (dimensionId: string) => ({ dimensionId });

describe("coversEveryDimension", () => {
  it("accepts exactly one decision per flagged dimension", () => {
    expect(coversEveryDimension(["a", "b"], [d("b"), d("a")])).toBe(true);
  });

  it("rejects a short list, which would leave a dimension blank", () => {
    expect(coversEveryDimension(["a", "b"], [d("a")])).toBe(false);
  });

  it("rejects duplicates, which also leave a dimension blank", () => {
    expect(coversEveryDimension(["a", "b"], [d("a"), d("a")])).toBe(false);
  });

  it("rejects an id that was never flagged", () => {
    expect(coversEveryDimension(["a", "b"], [d("a"), d("c")])).toBe(false);
  });

  it("rejects extra decisions beyond the flagged set", () => {
    expect(coversEveryDimension(["a"], [d("a"), d("b")])).toBe(false);
  });

  it("treats no flagged dimensions and no decisions as complete", () => {
    expect(coversEveryDimension([], [])).toBe(true);
  });
});
