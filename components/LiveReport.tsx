"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Report } from "@/components/Report";
import { BASELINE_ANSWERS } from "@/lib/baseline";
import { buildDiff, flaggedDiffs, summarize } from "@/lib/diff";
import { DIMENSIONS } from "@/lib/questions";
import { clearAnswers, loadAnswers } from "@/lib/session";
import type { Answer, Decision } from "@/lib/types";

/**
 * Renders the deterministic diff immediately, then fills the decision blocks in
 * as the model returns them. The reviewer is reading real content within a few
 * hundred milliseconds of finishing the interview, so the LLM latency lands
 * while they are already busy.
 */
export function LiveReport() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [fetched, setFetched] = useState<Decision[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Bootstrap from sessionStorage. This cannot run during render -- the store
  // does not exist on the server -- so the state set here is deliberate.
  useEffect(() => {
    const stored = loadAnswers();
    if (!stored || stored.length !== DIMENSIONS.length) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(stored);
  }, [router]);

  const diffs = answers ? buildDiff(DIMENSIONS, BASELINE_ANSWERS, answers) : null;
  const flagged = diffs ? flaggedDiffs(diffs) : [];

  // Nothing was flagged, so there is nothing for the model to write and no
  // call to make. Derived rather than set, so the report is never "loading"
  // for a request that will not happen.
  const decisions = diffs && flagged.length === 0 ? [] : fetched;

  useEffect(() => {
    if (!answers || flagged.length === 0) return;

    let cancelled = false;

    // The server derives the baseline and the scoring itself; it only needs
    // this side's answers.
    fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((response) => response.json())
      .then((body) => {
        if (cancelled) return;
        setFetched(body.decisions ?? []);
        if (body.unavailable) setUnavailable(true);
      })
      .catch(() => {
        if (cancelled) return;
        setFetched([]);
        setUnavailable(true);
      });

    return () => {
      cancelled = true;
    };
    // flagged is derived from answers, so answers alone is the real dependency.
  }, [answers, flagged.length]);

  if (!diffs) return null;

  return (
    <div>
      <Report
        diffs={diffs}
        summary={summarize(diffs)}
        decisions={decisions}
        synthesisUnavailable={unavailable}
      />
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => {
            clearAnswers();
            router.push("/interview");
          }}
          className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium"
        >
          Run it again
        </button>
      </div>
    </div>
  );
}
