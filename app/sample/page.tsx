import Link from "next/link";
import { Report } from "@/components/Report";
import { BASELINE_ANSWERS } from "@/lib/baseline";
import { buildDiff, summarize } from "@/lib/diff";
import { DIMENSIONS } from "@/lib/questions";
import { SAMPLE_ANSWERS, SAMPLE_DECISIONS } from "@/lib/sampleReport";

/**
 * Ungated on purpose: the point of the sample is that someone can see the
 * output before committing to anything. It is static and makes no API calls.
 */
export default function SamplePage() {
  const diffs = buildDiff(DIMENSIONS, BASELINE_ANSWERS, SAMPLE_ANSWERS);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
        <p className="text-xs text-muted">
          A recorded session between a product lead and an engineer.
        </p>
        <Link
          href="/interview"
          className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
        >
          Take it yourself
        </Link>
      </div>

      <Report
        diffs={diffs}
        summary={summarize(diffs)}
        decisions={SAMPLE_DECISIONS}
        synthesisUnavailable={false}
      />
    </main>
  );
}
