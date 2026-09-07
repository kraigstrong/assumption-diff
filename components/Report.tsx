import Link from "next/link";
import { PRD } from "@/lib/prd";
import type { DimensionDiff, Severity, Summary } from "@/lib/diff";
import type { Decision } from "@/lib/types";

const SEVERITY = {
  aligned: { label: "Aligned", className: "bg-aligned-bg text-aligned" },
  minor: { label: "Minor gap", className: "bg-minor-bg text-minor" },
  misaligned: { label: "Misaligned", className: "bg-misaligned-bg text-misaligned" },
} satisfies Record<Severity, { label: string; className: string }>;


/**
 * Explains the badges in words rather than numbers, and stays grammatical at
 * every ratio -- including all-aligned and all-misaligned.
 */
function breakdown(summary: Summary): string {
  if (summary.needsDecision === 0) {
    return "They gave the same answer every time, so there is nothing to settle before work starts.";
  }

  const parts: string[] = [];
  if (summary.aligned > 0) parts.push(`${summary.aligned} matched`);
  if (summary.minor > 0) {
    parts.push(`${summary.minor} came close without matching`);
  }
  if (summary.misaligned > 0) {
    parts.push(`${summary.misaligned} landed far enough apart to need a decision`);
  }

  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

  return `Of those, ${list}.`;
}

/**
 * Where each person sits on the dimension's axis. Four dots, two markers --
 * the gap is legible before any of the words are read.
 */
function Spectrum({ diff }: { diff: DimensionDiff }) {
  const { dimension, baseline, reviewer } = diff;

  return (
    <div className="py-1">
      <div className="mb-2 flex items-center justify-between text-[11px] text-muted">
        <span>{dimension.spectrum.low}</span>
        <span>{dimension.spectrum.high}</span>
      </div>
      {/* mx-2.5 keeps the markers at weight 0 and 3 fully inside the card. */}
      <div className="relative mx-2.5 h-1 rounded-full bg-line">
        {dimension.options.map((option) => (
          <span
            key={option.id}
            className="absolute top-1/2 size-1.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-line ring-2 ring-surface"
            style={{ left: `${(option.weight / 3) * 100}%` }}
          />
        ))}
        {baseline.option.weight === reviewer.option.weight ? (
          // Same position: one marker, or the filled one hides the other entirely.
          <Marker
            weight={baseline.option.weight}
            label="PE"
            title="Product and Engineering agree"
            filled
          />
        ) : (
          <>
            <Marker weight={baseline.option.weight} label="P" title="Product" />
            <Marker weight={reviewer.option.weight} label="E" title="Engineer" filled />
          </>
        )}
      </div>
    </div>
  );
}

function Marker({
  weight,
  label,
  title,
  filled = false,
}: {
  weight: number;
  label: string;
  title: string;
  filled?: boolean;
}) {
  return (
    <span
      title={title}
      className={`absolute top-1/2 flex h-5 min-w-5 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border px-1 text-[10px] font-semibold ${
        filled
          ? "border-foreground bg-foreground text-surface"
          : "border-foreground bg-surface text-foreground"
      }`}
      style={{ left: `${(weight / 3) * 100}%` }}
    >
      {label}
    </span>
  );
}

function PositionColumn({
  who,
  option,
  rationale,
  emphasis,
}: {
  who: string;
  option: DimensionDiff["baseline"]["option"];
  rationale: string;
  emphasis: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        emphasis ? "border-foreground/25 bg-surface" : "border-line bg-surface"
      }`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {who}
      </span>
      <p className="mt-2 text-sm font-medium leading-snug">{option.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{option.detail}</p>
      {rationale && (
        <p className="mt-3 border-l-2 border-line pl-3 text-xs italic leading-relaxed text-muted">
          “{rationale}”
        </p>
      )}
    </div>
  );
}

function DecisionBlock({
  decision,
  loading,
}: {
  decision: Decision | undefined;
  loading: boolean;
}) {
  if (decision) {
    return (
      <div className="mt-4 rounded-lg border border-foreground/15 bg-background p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Decision needed
        </p>
        <p className="mt-2 text-sm font-medium leading-snug">{decision.question}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{decision.stakes}</p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded border border-line bg-surface p-3">
            <dt className="text-[11px] font-semibold text-muted">If Product wins</dt>
            <dd className="mt-1 text-xs leading-relaxed">{decision.ifBaseline}</dd>
          </div>
          <div className="rounded border border-line bg-surface p-3">
            <dt className="text-[11px] font-semibold text-muted">If Engineering wins</dt>
            <dd className="mt-1 text-xs leading-relaxed">{decision.ifReviewer}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shimmer mt-4 rounded-lg border border-line bg-background p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Writing the decision…
        </p>
        <div className="mt-3 h-2 w-3/4 rounded bg-line" />
        <div className="mt-2 h-2 w-1/2 rounded bg-line" />
      </div>
    );
  }

  return null;
}

export function Report({
  diffs,
  summary,
  decisions,
  synthesisUnavailable,
}: {
  diffs: DimensionDiff[];
  summary: Summary;
  /** null while the LLM call is still in flight. */
  decisions: Decision[] | null;
  synthesisUnavailable: boolean;
}) {
  return (
    <div>
      <header className="border-b border-line pb-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Assumption diff · Account Deletion
          </p>
          {/* The browser's back button lands mid-interview, so give an exit. */}
          <Link
            href="/"
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Home
          </Link>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {summary.headline}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Product and Engineering answered the same {summary.total} questions
          about the same spec. {breakdown(summary)}
        </p>

        {synthesisUnavailable && summary.needsDecision > 0 && (
          <p className="mt-4 rounded-lg border border-dashed border-line p-3 text-xs leading-relaxed text-muted">
            The written decisions are unavailable right now — the model call
            didn’t return. Everything below is computed in code and is
            unaffected.
          </p>
        )}

        <details className="mt-5 rounded-lg border border-line bg-surface">
          <summary className="cursor-pointer px-4 py-2.5 text-xs font-medium text-muted marker:text-line">
            Original PRD text
          </summary>
          <div className="border-t border-line px-4 py-3">
            <p className="text-xs font-medium">{PRD.title}</p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted">
              {PRD.body}
            </p>
          </div>
        </details>
      </header>

      <ol className="mt-8 space-y-8">
        {diffs.map((diff) => {
          const severity = SEVERITY[diff.severity];
          const flagged = diff.severity !== "aligned";
          const decision = decisions?.find(
            (d) => d.dimensionId === diff.dimension.id,
          );

          return (
            <li key={diff.dimension.id}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  {diff.dimension.title}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${severity.className}`}
                >
                  {severity.label}
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-muted">
                {diff.dimension.question}
              </p>

              <div className="mt-4">
                <Spectrum diff={diff} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PositionColumn
                  who="Product"
                  option={diff.baseline.option}
                  rationale={diff.baseline.rationale}
                  emphasis={false}
                />
                <PositionColumn
                  who="Engineering (you)"
                  option={diff.reviewer.option}
                  rationale={diff.reviewer.rationale}
                  emphasis={flagged}
                />
              </div>

              {diff.followUp?.answer && (
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  <span className="font-semibold">Follow-up · </span>
                  {diff.followUp.question}{" "}
                  <span className="font-medium text-foreground">
                    → {diff.followUp.answer}
                  </span>
                </p>
              )}

              {flagged && (
                <DecisionBlock decision={decision} loading={decisions === null} />
              )}

              {!flagged && (
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Same position. Nothing to resolve here.
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <footer className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
        Agreement is determined in code by comparing the two answers — the model
        never decides what counts as a disagreement. It only writes the decision
        text for the dimensions already flagged.
      </footer>
    </div>
  );
}
