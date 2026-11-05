import { z } from "zod";
import { isPaymentsConfigured } from "@/lib/config";
import { fetchSubscription, verifyCheckoutSignature } from "@/lib/billing/razorpay";
import { syncSubscription } from "@/lib/billing/sync";
import { createAdminClient, getSessionUser } from "@/lib/supabase/server";
import { isSameOrigin, json, jsonError, readJson } from "@/lib/server/http";

const bodySchema = z.object({
  razorpay_payment_id: z.string().min(5).max(64),
  razorpay_subscription_id: z.string().min(5).max(64),
  razorpay_signature: z.string().min(10).max(256),
});

/**
 * Called by the browser after Razorpay Checkout succeeds. We verify the
 * signature, then fetch the subscription from Razorpay (server-to-server) as
 * the source of truth. Webhooks keep it in sync afterwards.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Invalid origin.");
  if (!isPaymentsConfigured()) return jsonError(503, "payments_not_active", "Payments aren't live yet.");
  const user = await getSessionUser();
  if (!user) return jsonError(401, "unauthorized", "Please sign in.");

  const body = bodySchema.safeParse(await readJson(req));
  if (!body.success) return jsonError(422, "invalid_input", "Invalid payment response.");
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body.data;

  if (!verifyCheckoutSignature(razorpay_payment_id, razorpay_subscription_id, razorpay_signature)) {
    return jsonError(400, "bad_signature", "Payment verification failed.");
  }

  // Make sure this subscription belongs to the signed-in user.
  const admin = createAdminClient();
  const { data: row } = (await admin
    ?.from("subscriptions")
    .select("user_id")
    .eq("provider_subscription_id", razorpay_subscription_id)
    .maybeSingle()) ?? { data: null };
  if (!row || row.user_id !== user.id) return jsonError(403, "forbidden", "Subscription mismatch.");

  try {
    const sub = await fetchSubscription(razorpay_subscription_id);
    await syncSubscription(sub, user.id);
    return json({ ok: true, status: sub.status });
  } catch (e) {
    console.error("[billing] verify fetch failed", e instanceof Error ? e.message : e);
    return json({ ok: true, status: "pending_confirmation" });
  }
}
