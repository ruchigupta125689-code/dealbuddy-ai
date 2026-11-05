import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config";
import type { PlanId } from "../plans";

const API = "https://api.razorpay.com/v1";

function authHeader() {
  const token = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString("base64");
  return `Basic ${token}`;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: authHeader(), "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw new Error(`razorpay_${res.status}: ${data?.error?.description ?? "request failed"}`);
  return data;
}

export function planIdFor(plan: Exclude<PlanId, "free">): string | undefined {
  return plan === "plus" ? config.razorpay.planIdPlus : config.razorpay.planIdPro;
}

export function planFromRazorpayPlanId(planId: string | undefined): PlanId | null {
  if (!planId) return null;
  if (planId === config.razorpay.planIdPlus) return "plus";
  if (planId === config.razorpay.planIdPro) return "pro";
  return null;
}

export interface RazorpaySubscription {
  id: string;
  plan_id: string;
  status: string; // created | authenticated | active | pending | halted | cancelled | completed | expired | paused
  current_start: number | null;
  current_end: number | null;
  notes?: Record<string, string>;
}

export async function createSubscription(plan: Exclude<PlanId, "free">, userId: string, email: string | null) {
  const planId = planIdFor(plan);
  if (!planId) throw new Error("plan_not_configured");
  return call<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      total_count: 120, // monthly, renews until cancelled (max 10 years)
      customer_notify: 1,
      notes: { user_id: userId, plan, email: email ?? "" },
    }),
  });
}

export async function fetchSubscription(id: string) {
  return call<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(id)}`);
}

export async function cancelSubscription(id: string, atCycleEnd = true) {
  return call<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: atCycleEnd ? 1 : 0 }),
  });
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Verifies the X-Razorpay-Signature header against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret = config.razorpay.webhookSecret): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Verifies the signature returned to Checkout after a subscription payment. */
export function verifyCheckoutSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string,
  secret = config.razorpay.keySecret,
): boolean {
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${paymentId}|${subscriptionId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

export function toIso(ts: number | null | undefined): string | null {
  return ts ? new Date(ts * 1000).toISOString() : null;
}
