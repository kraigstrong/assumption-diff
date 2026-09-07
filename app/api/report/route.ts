import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClient, MODELS } from "@/lib/anthropic";
import { clientIp, hasValidSession, rateLimit } from "@/lib/auth";
import { BASELINE_ANSWERS } from "@/lib/baseline";
import { coversEveryDimension } from "@/lib/decisions";
import { buildDiff, flaggedDiffs } from "@/lib/diff";
import { DIMENSIONS } from "@/lib/questions";
import { PRD } from "@/lib/prd";

/**
 * Writes the "decision needed" prose for dimensions the scoring already
 * flagged. It is told which dimensions disagree and by how much -- it does not
 * decide that. One call covers every flagged dimension.
 *
 * The client sends only its own answers. The baseline and the scoring are
 * derived here from the same modules the report renders with, so a tampered
 * payload cannot invent a disagreement or misreport the other side's position.
 */

/**
 * Built per request so `dimensionId` is an enum of exactly the flagged ids.
 * Structured outputs then make a misspelled or invented id impossible, rather
 * than something we have to detect after the fact.
 */
function decisionSchema(flaggedIds: string[]) {
  return z.object({
    decisions: z.array(
      z.object({
        dimensionId: z.enum(flaggedIds as [string, ...string[]]),
        question: z.string(),
        stakes: z.string(),
        ifBaseline: z.string(),
        ifReviewer: z.string(),
      }),
    ),
  });
}

const RequestSchema = z.object({
  answers: z
    .array(
      z.object({
        dimensionId: z.string().max(64),
        optionId: z.string().max(64),
        rationale: z.string().max(300),
        followUp: z
          .object({
            question: z.string().max(400),
            options: z.array(z.string().max(200)).max(5),
            answer: z.string().max(200).nullable(),
          })
          .optional(),
      }),
    )
    .length(DIMENSIONS.length),
});

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  if (!rateLimit(clientIp(request))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // buildDiff throws on an unknown dimension or option id.
  let flagged;
  try {
    flagged = flaggedDiffs(
      buildDiff(DIMENSIONS, BASELINE_ANSWERS, parsed.data.answers),
    );
  } catch {
    return NextResponse.json({ error: "Invalid answers." }, { status: 400 });
  }

  if (flagged.length === 0) return NextResponse.json({ decisions: [] });

  const flaggedIds = flagged.map((diff) => diff.dimension.id);

  const client = getClient();
  // No key: the report still renders its deterministic half.
  if (!client) return NextResponse.json({ decisions: [], unavailable: true });

  const blocks = flagged.map((diff) =>
    [
      `--- DIMENSION: ${diff.dimension.id} (${diff.dimension.title})`,
      `Gap: ${diff.distance} of 3 steps on the axis "${diff.dimension.spectrum.low} -> ${diff.dimension.spectrum.high}".`,
      `Option A -- "${diff.baseline.option.label}". Argued for because: ${diff.baseline.rationale}`,
      `Option B -- "${diff.reviewer.option.label}"${
        diff.reviewer.rationale ? `. Argued for because: ${diff.reviewer.rationale}` : ""
      }`,
      "`ifBaseline` is the cost of Option A. `ifReviewer` is the cost of Option B.",
      diff.followUp?.answer
        ? `Probed "${diff.followUp.question}" -- the engineer answered "${diff.followUp.answer}".`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  try {
    const response = await client.messages.parse(
      {
        model: MODELS.report,
        max_tokens: 4000,
        thinking: { type: "adaptive" },
        system:
          "Two people answered the same questions about a product spec and chose different options. " +
          "For EACH dimension given, write the concrete decision someone must make before engineering starts.\n\n" +
          "Rules:\n" +
          "- `question`: the decision as one specific question a team could put on an agenda and settle in a single meeting. Not a restatement of the disagreement.\n" +
          "- `stakes`: what specifically breaks or gets rebuilt if this stays unresolved. One sentence, concrete.\n" +
          "- `ifBaseline` / `ifReviewer`: the real cost of committing to that OPTION. Write about the option and its consequences for the product, never about the person who picked it or about anyone winning. One sentence each. Name a tradeoff, not a benefit.\n" +
          "- Be specific to THIS spec. No generic advice.\n" +
          "- Under 30 words per field. Plain language, no jargon, no hedging.\n" +
          "- Return exactly one entry per dimension given, copying the dimensionId verbatim.",
        messages: [
          {
            role: "user",
            content: `SPEC:\n${PRD.body}\n\nDISAGREEMENTS:\n\n${blocks.join("\n\n")}`,
          },
        ],
        output_config: {
          effort: "low",
          format: zodOutputFormat(decisionSchema(flaggedIds)),
        },
      },
      { timeout: 30_000 },
    );

    const decisions = response.parsed_output?.decisions ?? [];

    // A partial or duplicated list would leave flagged dimensions rendering an
    // empty gap, so anything less than full coverage falls back to the visible
    // notice. Whatever did come back is still shown alongside it.
    return NextResponse.json({
      decisions,
      unavailable: !coversEveryDimension(flaggedIds, decisions),
    });
  } catch (error) {
    console.error("[report] synthesis unavailable:", error);
    return NextResponse.json({ decisions: [], unavailable: true });
  }
}
