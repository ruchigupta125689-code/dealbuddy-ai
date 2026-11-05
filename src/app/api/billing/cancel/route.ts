import { isPaymentsConfigured } from "@/lib/config";
import { cancelSubscription } from "@/lib/billing/razorpay";
import { syncSubscription } from "@/lib/billing/sync";
import { createAdminClient, getSessionUser } from "@/lib/supabase/server";
import { isSameOrigin, json, jsonError } from "@/lib/server/http";

/** Cancels the user's active subscription at the end of the current cycle. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Invalid origin.");
  if (!isPaymentsConfigured()) return jsonError(503, "payments_not_active", "Payments aren't live yet.");
  const user = await getSessionUser();
  if (!user) return jsonError(401, "unauthorized", "Please sign in.");
  const admin = createAdminClient();
  const { data } = (await admin
    ?.from("subscriptions")
    .select("provider_subscription_id")
    .eq("user_id", user.id)
    .in("status", ["active", "authenticated", "pending"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()) ?? { data: null };
  if (!data?.provider_subscription_id) return jsonError(404, "no_subscription", "No active subscription.");
  try {
    const sub = await cancelSubscription(data.provider_subscription_id, true);
    await syncSubscription(sub, user.id);
    return json({ ok: true, status: sub.status });
  } catch (e) {
    console.error("[billing] cancel failed", e instanceof Error ? e.message : e);
    return jsonError(502, "billing_error", "Couldn't cancel right now. Please try again or contact support.");
  }
}
