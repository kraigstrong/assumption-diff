import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClient, MODELS } from "@/lib/anthropic";
import { clientIp, hasValidSession, rateLimit } from "@/lib/auth";
import { dimensionById } from "@/lib/questions";
import { PRD } from "@/lib/prd";

/**
 * Writes one probing follow-up question.
 *
 * Only called where the reviewer's answer diverges from the baseline -- that
 * gate is deterministic and lives in the client, so roughly a third of these
 * calls never happen. Never reveals the baseline's actual position; it only
 * probes the reviewer's own reasoning.
 */

const FollowUpSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
});

// Lengths are bounded so the route cannot be repurposed as a general-purpose
// LLM proxy by anyone who has the access code.
const RequestSchema = z.object({
  dimensionId: z.string().max(64),
  optionId: z.string().max(64),
  rationale: z.string().max(300).optional(),
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

  const dimension = dimensionById(parsed.data.dimensionId);
  const chosen = dimension?.options.find((o) => o.id === parsed.data.optionId);
  if (!dimension || !chosen) {
    return NextResponse.json({ error: "Unknown dimension." }, { status: 400 });
  }

  const client = getClient();
  // No API key configured: skip the probe rather than break the interview.
  if (!client) return NextResponse.json({ followUp: null });

  try {
    const response = await client.messages.parse(
      {
        model: MODELS.followUp,
        max_tokens: 1000,
        system:
          "You are interviewing an engineer about a product spec to surface hidden assumptions. " +
          "Ask ONE short follow-up question that pressure-tests the specific tradeoff they just accepted. " +
          "Probe the consequence they are least likely to have considered.\n\n" +
          "Stay inside the spec: build the question only from systems, users, and behaviour the spec actually mentions. " +
          "Do not invent product features, integrations, or infrastructure that are not in it.\n\n" +
          "Provide exactly 3 concrete, mutually exclusive answer options, each under 12 words. " +
          "Never mention that anyone else has answered, and never reveal or imply another person's position. " +
          "The question must be under 25 words and answerable by picking one option.",
        messages: [
          {
            role: "user",
            content: [
              `SPEC:\n${PRD.body}`,
              `TOPIC: ${dimension.title} - ${dimension.whyItMatters}`,
              `THEY WERE ASKED: ${dimension.question}`,
              `THEY CHOSE: "${chosen.label}" (${chosen.detail})`,
              parsed.data.rationale
                ? `THEIR REASONING: ${parsed.data.rationale}`
                : "THEY GAVE NO REASONING.",
            ].join("\n\n"),
          },
        ],
        output_config: { format: zodOutputFormat(FollowUpSchema) },
      },
      { timeout: 15_000 },
    );

    const followUp = response.parsed_output;
    if (!followUp || followUp.options.length < 2) {
      return NextResponse.json({ followUp: null });
    }

    return NextResponse.json({
      followUp: {
        question: followUp.question,
        options: followUp.options.slice(0, 3),
        answer: null,
      },
    });
  } catch (error) {
    // A failed probe must never block the interview.
    console.error("[followup] falling back to no probe:", error);
    return NextResponse.json({ followUp: null });
  }
}
