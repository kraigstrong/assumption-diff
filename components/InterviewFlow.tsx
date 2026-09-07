"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BASELINE_ANSWERS } from "@/lib/baseline";
import { shouldAskFollowUp } from "@/lib/diff";
import { PRD } from "@/lib/prd";
import { DIMENSIONS } from "@/lib/questions";
import { saveAnswers } from "@/lib/session";
import type { Answer, FollowUp } from "@/lib/types";

/**
 * Both probe kinds render identically. The reviewer should not be able to tell
 * whether they matched the baseline before answering -- knowing would nudge
 * them toward consistency, which is exactly the disagreement we are hunting.
 */
type Probe = { question: string; options: string[]; kind: "static" | "adaptive" };

type Phase = "core" | "probing" | "followup";

/** Weight the Product lead chose for a dimension, for the divergence gate. */
function baselineWeight(dimensionId: string): number {
  const answer = BASELINE_ANSWERS.find((a) => a.dimensionId === dimensionId);
  const dimension = DIMENSIONS.find((d) => d.id === dimensionId);
  const option = dimension?.options.find((o) => o.id === answer?.optionId);
  if (!option) throw new Error(`No baseline for dimension "${dimensionId}"`);
  return option.weight;
}

export function InterviewFlow() {
  const router = useRouter();
  // The spec has to be read before the questions mean anything, so it is the
  // first step of the flow rather than something to scroll past on the landing.
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("core");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [probe, setProbe] = useState<Probe | null>(null);

  const dimension = DIMENSIONS[index];
  const isLast = index === DIMENSIONS.length - 1;

  function finish(allAnswers: Answer[]) {
    saveAnswers(allAnswers);
    router.push("/report");
  }

  function commit(answer: Answer) {
    const next = [...answers, answer];
    setAnswers(next);

    if (isLast) {
      finish(next);
      return;
    }

    setIndex(index + 1);
    setPhase("core");
    setOptionId(null);
    setRationale("");
    setProbe(null);
  }

  async function submitCore() {
    if (!optionId) return;

    const chosen = dimension.options.find((o) => o.id === optionId);
    if (!chosen) return;

    const answer: Answer = {
      dimensionId: dimension.id,
      optionId,
      rationale: rationale.trim(),
    };

    const distance = Math.abs(baselineWeight(dimension.id) - chosen.weight);

    // They agreed on the surface. Ask the frozen second-order probe -- the same
    // question the baseline answered, which is what makes the two comparable
    // and lets the answer change the verdict. No API call, so it is instant.
    if (!shouldAskFollowUp(distance)) {
      const staticProbe = dimension.alignmentProbes[optionId];
      if (staticProbe) {
        setProbe({ ...staticProbe, kind: "static" });
        setPhase("followup");
        return;
      }
      commit(answer);
      return;
    }

    // They diverged. The disagreement is already established, so this probe is
    // adaptive and serves as evidence for the report rather than as a verdict.
    setPhase("probing");
    try {
      const response = await fetch("/api/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimensionId: dimension.id,
          optionId,
          rationale: answer.rationale,
        }),
      });
      const body = await response.json().catch(() => null);

      if (body?.followUp) {
        setProbe({
          question: body.followUp.question,
          options: body.followUp.options,
          kind: "adaptive",
        });
        setPhase("followup");
        return;
      }
    } catch {
      // Fall through: a failed probe must not block the interview.
    }
    commit(answer);
  }

  function answerProbe(choice: string) {
    if (!optionId || !probe) return;

    const answer: Answer = {
      dimensionId: dimension.id,
      optionId,
      rationale: rationale.trim(),
    };

    if (probe.kind === "static") {
      // Comparable against the baseline's recorded answer, so it is scored.
      commit({ ...answer, probeAnswer: choice });
      return;
    }

    // Adaptive: kept for the report to read, never scored.
    const followUp: FollowUp = {
      question: probe.question,
      options: probe.options,
      answer: choice,
    };
    commit({ ...answer, followUp });
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Before you start
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          You’re the engineer who has to build this.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Read the spec below. Then you’ll answer {DIMENSIONS.length} questions
          about how you’d actually build it. The product lead who wrote it has
          already answered the same ones.
        </p>

        <div className="mt-6 rounded-lg border border-line bg-surface p-5">
          <p className="text-sm font-medium">{PRD.title}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {PRD.body}
          </p>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">
          What you’ll be asked about
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {DIMENSIONS.map((d) => (
            <li key={d.id} className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-medium">{d.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {d.spectrum.low} → {d.spectrum.high}
              </p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-8 w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background"
        >
          Start the interview
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {index + 1} of {DIMENSIONS.length} · {dimension.title}
        </span>
        <div className="flex flex-1 gap-1.5">
          {DIMENSIONS.map((d, i) => (
            <span
              key={d.id}
              className={`h-1 flex-1 rounded-full ${
                i < index ? "bg-foreground" : i === index ? "bg-foreground/40" : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      {phase === "core" && (
        <div className="mt-8">
          <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            {dimension.question}
          </h1>

          <div className="mt-6 space-y-2">
            {dimension.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setOptionId(option.id)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  optionId === option.id
                    ? "border-foreground bg-surface"
                    : "border-line bg-surface hover:border-foreground/30"
                }`}
              >
                <span className="block text-sm font-medium leading-snug">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {option.detail}
                </span>
              </button>
            ))}
          </div>

          <label className="mt-6 block">
            <span className="text-xs font-medium text-muted">
              In one line, why? (optional)
            </span>
            <input
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              maxLength={160}
              placeholder="The reasoning behind your pick"
              className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-foreground/40"
            />
          </label>

          <button
            type="button"
            onClick={submitCore}
            disabled={!optionId}
            className="mt-6 w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-40"
          >
            {isLast ? "See the diff" : "Next"}
          </button>
        </div>
      )}

      {phase === "probing" && (
        <div className="mt-8 py-16 text-center">
          <div className="shimmer text-sm text-muted">
            Following up on that answer…
          </div>
        </div>
      )}

      {phase === "followup" && probe && (
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Follow-up
          </p>
          <h1 className="mt-2 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            {probe.question}
          </h1>

          <div className="mt-6 space-y-2">
            {probe.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => answerProbe(option)}
                className="w-full rounded-lg border border-line bg-surface p-4 text-left text-sm leading-snug transition hover:border-foreground/30"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
