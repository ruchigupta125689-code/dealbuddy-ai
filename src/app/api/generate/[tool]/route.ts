import { NextResponse } from "next/server";
import { AIError, generateStructured } from "@/lib/ai/claude";
import { PLANS } from "@/lib/plans";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import {
  getEntitlement,
  logGeneration,
  releaseGeneration,
  reserveGeneration,
  resolveContext,
} from "@/lib/server/usage";
import { buildUserMessage, computeEstimate, demoOutput, inputSummary, normaliseOutput } from "@/lib/server/generate";
import { TOOL_SCHEMAS, fieldErrors, isToolId } from "@/lib/tools/schemas";

const MAX_BODY_BYTES = 64 * 1024;
const envInt = (name: string, fallback: number) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
// Burst limits per minute (configurable). The hard monthly/lifetime quota is enforced in the database.
const IP_LIMIT = envInt("RATE_LIMIT_IP_PER_MIN", 20);
const USER_LIMIT = envInt("RATE_LIMIT_USER_PER_MIN", 8);
const PRIORITY_USER_LIMIT = envInt("RATE_LIMIT_PRIORITY_USER_PER_MIN", 20);

function err(status: number, error: string, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, ctx: RouteContext<"/api/generate/[tool]">) {
  const { tool } = await ctx.params;
  if (!isToolId(tool)) return err(404, "unknown_tool", "This tool doesn't exist.");

  const ip = clientIp(req);
  const ipLimit = rateLimit(`gen:ip:${ip}`, IP_LIMIT, 60_000);
  if (!ipLimit.ok) {
    return err(429, "rate_limited", `Too many requests. Please wait ${ipLimit.retryAfter}s and try again.`, {
      retryAfter: ipLimit.retryAfter,
    });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return err(413, "too_large", "That input is too long. Please shorten it.");
  let body: unknown;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return err(400, "bad_json", "Invalid request.");
  }

  const parsed = TOOL_SCHEMAS[tool].input.safeParse(body);
  if (!parsed.success) {
    return err(422, "invalid_input", "Please fix the highlighted fields.", { fields: fieldErrors(parsed.error) });
  }
  const input = parsed.data as Record<string, unknown>;
  const estimate = computeEstimate(tool, input);

  const context = await resolveContext(ip);

  if (context.mode === "demo") {
    return NextResponse.json(
      {
        mode: "demo",
        demoReason: context.demoReason,
        result: demoOutput(tool, input, estimate),
        estimate,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  let entitlement;
  try {
    entitlement = await getEntitlement(context);
  } catch {
    entitlement = null;
  }
  if (!entitlement) return err(503, "usage_unavailable", "We couldn't check your usage right now. Please try again.");

  const plan = PLANS[entitlement.plan];
  const userKey = context.user?.id ?? context.localKey ?? ip;
  const userLimit = rateLimit(`gen:user:${userKey}`, plan.priority ? PRIORITY_USER_LIMIT : USER_LIMIT, 60_000);
  if (!userLimit.ok) {
    return err(429, "rate_limited", `You're going a bit fast. Try again in ${userLimit.retryAfter}s.`, {
      retryAfter: userLimit.retryAfter,
    });
  }

  // Detailed mode is a paid feature; quietly fall back to standard for free users.
  const detailed = Boolean(input.detailed) && plan.detailedMode;

  let reserved = false;
  try {
    reserved = await reserveGeneration(context, entitlement);
  } catch {
    return err(503, "usage_unavailable", "We couldn't check your usage right now. Please try again.");
  }
  if (!reserved) {
    return err(402, "limit_reached", limitMessage(entitlement.plan), {
      entitlement: { ...entitlement, remaining: 0, used: entitlement.limit },
    });
  }

  try {
    const result = await generateStructured({
      tool,
      userMessage: buildUserMessage(tool, { ...input, detailed }, estimate),
      detailed,
      priority: plan.priority,
    });
    const generationId = await logGeneration(context, tool, inputSummary(tool, input));
    const used = entitlement.used + 1;
    return NextResponse.json(
      {
        mode: context.mode,
        result: normaliseOutput(tool, result.output),
        estimate,
        generationId,
        detailed,
        entitlement: { ...entitlement, used, remaining: Math.max(0, entitlement.limit - used) },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    await releaseGeneration(context, entitlement);
    if (e instanceof AIError) {
      const status =
        e.code === "rate_limited" ? 429 : e.code === "timeout" ? 504 : e.code === "overloaded" ? 503 : e.code === "not_configured" ? 503 : 502;
      return err(status, e.code, `${e.message} This attempt didn't use a generation.`);
    }
    console.error("[generate] unexpected", e instanceof Error ? e.message : e);
    return err(500, "server_error", "Something went wrong. This attempt didn't use a generation.");
  }
}

function limitMessage(plan: string) {
  return plan === "free"
    ? "You've used all your free AI generations. Upgrade to Creator Plus or Pro to keep going."
    : "You've reached this month's generation allowance. Upgrade or wait for your next billing period.";
}
