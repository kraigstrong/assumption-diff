# Review instructions

This is a 1-2 hour interview demo. Optimize review for signal, not polish.

## Report only

- **Correctness bugs**: wrong scoring math, broken state transitions, crashes,
  incorrect handling of the baseline-vs-reviewer comparison.
- **Security**: secrets reachable client-side, auth bypass on `/api/*`, unsafe
  cookie handling, timing-unsafe secret comparison.
- **Anything that breaks the live demo**: unhandled API failures, dead-end UI
  states, infinite loading, unrecoverable errors mid-interview.

## Do not report

- Style, naming, formatting, import order.
- Missing abstractions, "this could be a hook", DRY suggestions.
- Test coverage beyond `lib/diff.ts`.
- Accessibility and responsive polish.
- Anything you would preface with "nit:".

Clarity beats abstraction here by explicit instruction. Duplication is acceptable.

## Where to look first

- `lib/diff.ts` — the deterministic scoring core. All misalignment decisions
  happen here, never in the LLM. Bugs here invalidate the whole report. Note the
  second-order path: two people can pick the same option and still be scored as
  a "deeper gap" if they answer the frozen probe differently.
- `lib/questions.ts` + `lib/baseline.ts` — three fixtures referring to each other
  by string id. A mismatch is silent, not loud; `lib/fixtures.test.ts` is what
  catches it.
- `lib/auth.ts`, `app/api/*/route.ts` — access gate and the two LLM routes.
- `app/interview/page.tsx` — the state machine driving the interview.
