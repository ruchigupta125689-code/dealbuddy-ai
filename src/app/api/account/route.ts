import { z } from "zod";
import { isPaymentsConfigured } from "@/lib/config";
import { cancelSubscription } from "@/lib/billing/razorpay";
import { createAdminClient, createUserClient, getSessionUser } from "@/lib/supabase/server";
import { isSameOrigin, json, jsonError, readJson } from "@/lib/server/http";

const patchSchema = z.object({
  name: z.string().trim().max(80).optional(),
  historyEnabled: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Invalid origin.");
  const user = await getSessionUser();
  const supabase = await createUserClient();
  if (!user || !supabase) return jsonError(401, "unauthorized", "Sign in first.");
  const body = patchSchema.safeParse(await readJson(req));
  if (!body.success) return jsonError(422, "invalid_input", "Invalid settings.");
  const update: Record<string, unknown> = {};
  if (body.data.name !== undefined) update.name = body.data.name || null;
  if (body.data.historyEnabled !== undefined) update.history_enabled = body.data.historyEnabled;
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return jsonError(500, "db_error", "Couldn't update settings.");
  return json({ ok: true });
}

/**
 * Permanently deletes the account and all associated data (profile, saved
 * results, usage, subscription records) via ON DELETE CASCADE.
 */
export async function DELETE(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Invalid origin.");
  const user = await getSessionUser();
  const admin = createAdminClient();
  if (!user || !admin) return jsonError(401, "unauthorized", "Sign in first.");

  // Stop future charges before deleting records.
  if (isPaymentsConfigured()) {
    const { data: subs } = await admin
      .from("subscriptions")
      .select("provider_subscription_id")
      .eq("user_id", user.id)
      .in("status", ["active", "authenticated", "pending", "created"]);
    for (const s of subs ?? []) {
      if (!s.provider_subscription_id) continue;
      try {
        await cancelSubscription(s.provider_subscription_id, false);
      } catch (e) {
        console.error("[account] cancel during delete failed", e instanceof Error ? e.message : e);
        return jsonError(502, "billing_error", "We couldn't cancel your subscription, so the account wasn't deleted. Please try again.");
      }
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return jsonError(500, "delete_failed", "Couldn't delete your account. Please try again.");
  const supabase = await createUserClient();
  await supabase?.auth.signOut();
  return json({ ok: true });
}
