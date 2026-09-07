import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Assumption Diff
      </p>
      <h1 className="mt-4 text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-[2.6rem]">
        Implementation is getting faster.
        <br />
        Clarity matters more than ever.
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
        It’s easy for engineering and product to read the same spec, agree on
        it, and walk away with completely different ideas about what they’re
        building. And now it’s easier than ever to move quickly in the wrong
        direction.
      </p>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        Assumption Diff interviews people independently across the same set of
        decisions, surfaces where their assumptions differ, and identifies what
        needs to be clarified before anyone starts building.
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
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
