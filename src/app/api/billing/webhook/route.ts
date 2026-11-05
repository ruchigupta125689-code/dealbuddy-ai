import { config } from "@/lib/config";
import { verifyWebhookSignature, type RazorpaySubscription } from "@/lib/billing/razorpay";
import { syncSubscription } from "@/lib/billing/sync";
import { json, jsonError } from "@/lib/server/http";

const HANDLED = new Set([
  "subscription.authenticated",
  "subscription.activated",
  "subscription.charged",
  "subscription.pending",
  "subscription.halted",
  "subscription.cancelled",
  "subscription.completed",
  "subscription.paused",
  "subscription.resumed",
  "subscription.updated",
]);

/**
 * Razorpay webhook. The signature is verified against the RAW body before
 * anything is trusted. Configure the URL in Razorpay → Settings → Webhooks.
 */
export async function POST(req: Request) {
  if (!config.razorpay.webhookSecret) return jsonError(503, "not_configured", "Webhook secret not configured.");
  const raw = await req.text();
  if (raw.length > 256 * 1024) return jsonError(413, "too_large", "Payload too large.");
  const signature = req.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, signature)) return jsonError(400, "bad_signature", "Invalid signature.");

  let event: { event?: string; payload?: { subscription?: { entity?: RazorpaySubscription } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return jsonError(400, "bad_json", "Invalid payload.");
  }

  if (!event.event || !HANDLED.has(event.event)) return json({ ok: true, ignored: true });
  const sub = event.payload?.subscription?.entity;
  if (!sub?.id) return json({ ok: true, ignored: true });

  const ok = await syncSubscription(sub);
  // Return 5xx on failure so Razorpay retries.
  return ok ? json({ ok: true }) : jsonError(500, "sync_failed", "Could not sync subscription.");
}
