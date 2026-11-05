import { z } from "zod";
import { config, isPaymentsConfigured } from "@/lib/config";
import { createSubscription } from "@/lib/billing/razorpay";
import { createAdminClient, getSessionUser } from "@/lib/supabase/server";
import { isSameOrigin, json, jsonError, readJson } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";

const bodySchema = z.object({ plan: z.enum(["plus", "pro"]) });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Invalid origin.");
  if (!isPaymentsConfigured()) {
    return jsonError(503, "payments_not_active", "Payments aren't live yet. You can keep using your free generations.");
  }
  const user = await getSessionUser();
  if (!user) return jsonError(401, "unauthorized", "Please sign in to upgrade.");
  if (!rateLimit(`billing:${user.id}`, 5, 60_000).ok) return jsonError(429, "rate_limited", "Please wait a moment.");

  const body = bodySchema.safeParse(await readJson(req));
  if (!body.success) return jsonError(422, "invalid_input", "Choose a plan.");

  try {
    const sub = await createSubscription(body.data.plan, user.id, user.email);
    const admin = createAdminClient();
    await admin?.from("subscriptions").insert({
      user_id: user.id,
      plan: body.data.plan,
      status: sub.status, // "created" until the first payment is authorised
      provider: "razorpay",
      provider_subscription_id: sub.id,
    });
    return json({ subscriptionId: sub.id, keyId: config.razorpay.keyId, email: user.email });
  } catch (e) {
    console.error("[billing] create failed", e instanceof Error ? e.message : e);
    return jsonError(502, "billing_error", "We couldn't start checkout. Please try again.");
  }
}
