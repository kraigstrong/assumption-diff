# Assumption Diff

Two people read the same PRD, agree it's clear, and build different things. This
demo catches that on day one.

It interviews a product lead and an engineer separately with the **same
forced-choice questions**, scores how far apart their answers sit, and produces
a report naming the concrete decisions someone has to make before work starts.

**Start here: [`/sample`](#viewing-the-sample-report) — a finished report, no setup, no API key.**

---

## The demo in one minute

The PRD under review is one paragraph: *"Customers need to be able to delete
their account."* Everyone understands it. Almost nobody agrees on what it means.

The interview asks about four dimensions where that ambiguity hides:

| Dimension | The axis |
|---|---|
| **Deletion Scope** | Erase everything → keep everything, hidden |
| **Shared Data** | The person owns it → the workspace owns it |
| **Timing & Reversibility** | Final on click → always recoverable |
| **Legal Retention** | Deletion wins → retention wins |

Each has four answer options placed on that axis with a weight of 0–3.
Disagreement is `|weightA − weightB|`:

| Distance | Second-order probe | Verdict | Colour |
|---|---|---|---|
| 0 | probe answers match | Aligned | green |
| 0 | probe answers differ | **Deeper gap** | yellow |
| 1 | — | Minor gap | yellow |
| 2–3 | — | Misaligned | red |

Every non-aligned dimension gets a decision block. A one-step gap is a smaller
disagreement, not a skippable one, and a deeper gap is a real one hiding under
an apparent agreement — so the headline counts exactly the set of dimensions
that get a block.

**The product lead's answers are pre-recorded** (`lib/baseline.ts`), so the demo
is single-player and reproducible: you play the engineer and diff against a
fixed position. No database, no session handoff, no second browser.

---

## Running it

```bash
npm install
cp example.env .env    # then fill in the three values
npm run dev
```

Open http://localhost:3000.

### With 1Password (how this project is actually run)

`.env` holds `op://` secret references rather than secret values, so nothing
sensitive is ever written to disk. `op run` resolves them into the process
environment at launch:

```bash
npm run dev:op
```

That is `op run --env-file=.env -- next dev`. Injected values take precedence
over anything dotenv reads from the file, so Next.js sees resolved secrets and
never the literal `op://` strings. The same wrapper applies to the generator:
`npm run generate:questions`.

`example.env` documents all three variables:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Server-side only. Never reaches the browser. |
| `DEMO_ACCESS_CODE` | Shared passphrase gating the interview. |
| `SESSION_SECRET` | Signs the session cookie. `openssl rand -hex 32` |

### Viewing the sample report

`/sample` is **ungated and needs no API key** — it renders a recorded session
through the same component the live report uses. It's the fastest way to see
what the tool produces.

### Running the tests

```bash
npm test
```

Covers `lib/diff.ts`, the scoring core. That is the only file with logic worth
testing; everything else is rendering or a thin API wrapper.

---

## Where the LLM is used, and where it deliberately isn't

The requirement was to prefer deterministic code and use the model only where it
adds value. Concretely:

**Code does, and the model never touches:**

- Which dimensions are asked, in what order, with which options and weights.
- Whether two answers disagree, and by how much (`lib/diff.ts`).
- Whether a follow-up is worth asking, and which kind to ask.
- Whether an apparent agreement survives its second-order probe.
- Every number and badge on the report.

**The model does:**

| Where | Model | Why that model |
|---|---|---|
| `scripts/generate-questions.ts` | `claude-opus-5` | Offline, run once. Latency is free and the output is committed, so buy the best. |
| `POST /api/followup` | `claude-haiku-4-5` | On the critical path 2–3× mid-interview. Small constrained schema. Measured ~4s. |
| `POST /api/report` | `claude-sonnet-5` | Writes prose about a diff the code already computed. One call covers every flagged dimension. Measured ~11s. |

Those are measured, not estimated. The report call is the slow one, which is why
`/report` renders its deterministic half immediately and fills the decision
blocks in afterwards — by the time you have read the first comparison, the
prose has arrived.

Model IDs are constants in `lib/models.ts` — one line each to change.

### Two kinds of follow-up, doing two different jobs

Every dimension gets a follow-up, but which kind depends on whether you agreed
with the baseline — and the difference matters more than it looks.

**Where you diverge: an adaptive probe.** The model writes a question tailored
to the answer you just gave. It's multiple-choice (the model writes the question
*and* its three options), so nothing is open-ended. It is **evidence** — it
enriches the decision text on the report, but it never changes a verdict.

**Where you agree: a frozen probe.** A fixed second-order question stored in
`lib/questions.ts`, which the product lead already answered too. Because both
people answered *the same* question, their answers are comparable — and a
comparable answer can **change the verdict**. Agreeing that deletion means "hard
delete the rows" and then splitting on whether that reaches the backups is a
real disagreement, and the report now says so.

That asymmetry is not arbitrary:

> Any probe that can change an outcome must be answered by both people, which
> means it cannot be generated at runtime from one person's reasoning. Adaptive
> probes are structurally limited to being evidence. That is the entire reason
> the second-order probes are fixtures.

The frozen probes need no API call, so they are instant. Only the option the
baseline picked is ever reachable, so there are four of them, not sixteen —
`lib/fixtures.test.ts` enforces that they exist, that the baseline answered
them, and that no unreachable ones accumulate.

### If the model is unavailable, the demo still works

Missing API key, timeout, or an API error: adaptive follow-ups are skipped and
the report renders its full deterministic half with a visible note in place of
the decision prose.

The frozen probes are unaffected, because they never touch the network. A run
with `ANTHROPIC_API_KEY` unset still asks them, still scores them, and still
reports deeper gaps — disagreements that would otherwise read as "Aligned on all
4 dimensions". The deterministic path finds *more* than it used to, not less.
Verify it yourself by unsetting the key and running the interview.

---

## Security

- `ANTHROPIC_API_KEY` is read only inside route handlers. It is never a
  `NEXT_PUBLIC_*` variable and never reaches the client bundle.
- `POST /api/access` compares the submitted code against `DEMO_ACCESS_CODE`
  using `timingSafeEqual` over HMACs of both sides, so lengths always match and
  a wrong-length guess leaks nothing.
- On success it sets an **HMAC-signed** httpOnly + sameSite=lax cookie (secure
  in production) whose signature covers its own expiry. It is a real credential,
  not a boolean flag someone can set in devtools.
- Both LLM routes verify that cookie before doing any work.
- There is a per-IP rate limit, but be clear about what it is: an in-memory
  `Map`, so on Vercel it is **per-instance and resets on cold start**. It is a
  speed bump, not a quota. The access code is the actual control.
- `POST /api/report` takes only *your* answers. The baseline and the scoring are
  derived server-side from the same modules the report renders with, so a
  tampered payload cannot invent a disagreement or misstate the other side's
  position.
- Request payloads have bounded string lengths and array sizes, so someone with
  the access code can't repurpose the routes as a general-purpose LLM proxy.

**Known and deliberate:** the product lead's answers ship in the client bundle.
They have to — the follow-up gate compares against them in the browser to decide
whether a call is warranted. They are demo content, not a secret, and there is
no score to game: the tool's value depends on you answering honestly. If this
were real, the baseline would live server-side and the gate would move into the
API route.

---

## Layout

```
app/
  page.tsx              landing — try it, or view the sample
  sample/page.tsx       static example report (ungated)
  interview/page.tsx    checks the session server-side, then gates or runs
  report/page.tsx       the live report
  api/access|followup|report/route.ts
components/
  Report.tsx            shared by the live report and the sample
  InterviewFlow.tsx     the interview state machine
  AccessGate.tsx        the passphrase form
  LiveReport.tsx        renders the diff instantly, fills decisions in as they arrive
lib/
  diff.ts               the scoring core  <- start here
  questions.ts          the frozen question set, plus the second-order probes
  baseline.ts           the product lead's recorded answers, including probes
  fixtures.test.ts      guards the id references between those three files
  sampleReport.ts       a recorded session, for /sample
  models.ts, anthropic.ts, auth.ts, session.ts, prd.ts, types.ts
scripts/
  generate-questions.ts one-time question generator
```

### Why the question set is a committed fixture

`lib/questions.ts` is generated once and checked in, not built at runtime.
`lib/baseline.ts` refers to its option ids, so regenerating questions live would
let the two drift apart and quietly make every comparison meaningless.

To regenerate: `npm run generate:questions`. It writes
`lib/questions.generated.ts` — *not* `questions.ts` — so you can diff it by hand
and re-check the baseline before adopting anything.

### Regenerating the sample report

`lib/sampleReport.ts` is captured from a real session — the follow-up questions
in it were written by Haiku and the decisions by Sonnet, through the same routes
the live report uses. None of it is hand-written, so `/sample` cannot flatter
the tool by showing output better than it actually produces.

It stores only the engineer's answers and the decision text. The diff is
recomputed by `lib/diff.ts` at render time, so the sample can never display
scoring a real run wouldn't produce.

To re-capture: run the interview with answers that diverge from the baseline,
then read the request/response pair for `POST /api/report` out of devtools and
paste both into the fixture. The shape is `SAMPLE_ANSWERS` (what the interview
saved to sessionStorage) and `SAMPLE_DECISIONS` (what the route returned).

---

## Scope notes

Built as a time-boxed demo. Deliberately not included: multi-user sessions,
persistence beyond `sessionStorage`, authentication beyond a shared passphrase,
support for arbitrary uploaded PRDs, and any database. Each of those was a
considered trade-off against the smallest complete experience that shows the
idea.
