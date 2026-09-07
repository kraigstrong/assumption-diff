import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
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
    </main>
  );
}
