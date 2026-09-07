import Link from "next/link";
import { PRD } from "@/lib/prd";
import { DIMENSIONS } from "@/lib/questions";

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Assumption Diff
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        Everyone agreed on the spec.
        <br />
        They just meant different things.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
        A PRD reads as settled, then engineering builds one thing and product
        expected another. The disagreement was there on day one — nobody asked a
        question sharp enough to expose it.
      </p>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        This interviews both people separately with the same forced-choice
        questions, scores how far apart their answers sit, and names the
        decisions someone has to make before work starts.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/interview"
          className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background"
        >
          Try it now — 3 minutes
        </Link>
        <Link
          href="/sample"
          className="rounded-lg border border-line bg-surface px-5 py-3 text-sm font-medium"
        >
          View a sample report
        </Link>
      </div>
      <p className="mt-3 text-xs text-muted">
        The interview needs an access code. The sample report doesn’t.
      </p>

      <section className="mt-14 border-t border-line pt-8">
        <h2 className="text-sm font-semibold">How it works</h2>
        <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <li>
            <span className="font-medium text-foreground">1.</span> The product
            lead who wrote this spec has already been interviewed. Their answers
            are recorded.
          </li>
          <li>
            <span className="font-medium text-foreground">2.</span> You answer
            the same {DIMENSIONS.length} questions as the engineer who has to
            build it. Where your answer diverges, you get one follow-up.
          </li>
          <li>
            <span className="font-medium text-foreground">3.</span> The report
            scores the gaps in code and spells out what has to be decided.
          </li>
        </ol>

        <h2 className="mt-10 text-sm font-semibold">What you’ll be asked about</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {DIMENSIONS.map((dimension) => (
            <li
              key={dimension.id}
              className="rounded-lg border border-line bg-surface p-4"
            >
              <p className="text-sm font-medium">{dimension.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {dimension.spectrum.low} → {dimension.spectrum.high}
              </p>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-sm font-semibold">The spec under review</h2>
        <div className="mt-3 rounded-lg border border-line bg-surface p-5">
          <p className="text-sm font-medium">{PRD.title}</p>
          <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted">
            {PRD.body}
          </p>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Four sentences of that spec are ambiguous enough to build two different
          products from. The interview finds which four.
        </p>
      </section>
    </main>
  );
}
