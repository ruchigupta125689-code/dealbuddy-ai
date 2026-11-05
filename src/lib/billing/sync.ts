import "server-only";
import { createAdminClient } from "../supabase/server";
import { planFromRazorpayPlanId, toIso, type RazorpaySubscription } from "./razorpay";

/**
 * Writes Razorpay's view of a subscription into our `subscriptions` table.
 * Idempotent: safe to call from both the webhook and the checkout callback.
 */
export async function syncSubscription(sub: RazorpaySubscription, fallbackUserId?: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const plan = planFromRazorpayPlanId(sub.plan_id);
  if (!plan) {
    console.error("[billing] unknown plan id", sub.plan_id);
    return false;
  }

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id, user_id")
    .eq("provider_subscription_id", sub.id)
    .maybeSingle();

  const userId = existing?.user_id ?? sub.notes?.user_id ?? fallbackUserId;
  if (!userId) {
    console.error("[billing] no user for subscription", sub.id);
    return false;
  }

  const row = {
    user_id: userId,
    plan,
    status: sub.status,
    provider: "razorpay",
    provider_subscription_id: sub.id,
    current_period_start: toIso(sub.current_start),
    current_period_end: toIso(sub.current_end),
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await admin.from("subscriptions").update(row).eq("id", existing.id)
    : await admin.from("subscriptions").insert(row);
  if (error) {
    console.error("[billing] sync failed", error.message);
    return false;
  }
  return true;
}
