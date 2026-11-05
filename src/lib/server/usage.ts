import "server-only";
import { isAIConfigured, isLocalPreviewAllowed, isSupabaseConfigured } from "../config";
import { PLANS, type PlanId } from "../plans";
import { createAdminClient, getSessionUser, type SessionUser } from "../supabase/server";
import type { ToolId } from "../tools/schemas";

export type GenerationMode = "live" | "local" | "demo";
export type DemoReason = "ai_not_configured" | "signed_out" | "auth_not_configured";

export interface Entitlement {
  plan: PlanId;
  limit: number;
  used: number;
  remaining: number;
  periodStart: string; // ISO date
  periodEnd: string | null;
  subscriptionStatus: string | null;
}

export interface RequestContext {
  mode: GenerationMode;
  demoReason?: DemoReason;
  user: SessionUser | null;
  /** Key used for local (in-memory) quota. */
  localKey?: string;
}

const FREE_PERIOD = "1970-01-01";
const LOCAL_LIMIT = (() => {
  const n = Number.parseInt(process.env.LOCAL_PREVIEW_LIMIT ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : PLANS.free.limit;
})();

export async function resolveContext(ip: string): Promise<RequestContext> {
  const user = await getSessionUser();
  if (!isAIConfigured()) return { mode: "demo", demoReason: "ai_not_configured", user };
  if (isSupabaseConfigured()) {
    if (!user) return { mode: "demo", demoReason: "signed_out", user: null };
    return { mode: "live", user };
  }
  if (isLocalPreviewAllowed()) return { mode: "local", user: null, localKey: `ip:${ip}` };
  return { mode: "demo", demoReason: "auth_not_configured", user: null };
}

/* ---------------- Local preview (no database) ---------------- */

const localUsage = new Map<string, number>();

function localEntitlement(key: string): Entitlement {
  const used = localUsage.get(key) ?? 0;
  return {
    plan: "free",
    limit: LOCAL_LIMIT,
    used,
    remaining: Math.max(0, LOCAL_LIMIT - used),
    periodStart: FREE_PERIOD,
    periodEnd: null,
    subscriptionStatus: null,
  };
}

/* ---------------- Supabase-backed ---------------- */

async function activeSubscription(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("subscriptions")
    .select("plan, status, current_period_start, current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "authenticated", "pending"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[usage] subscription lookup failed", error.message);
    return null;
  }
  if (!data) return null;
  // "pending" = payment retrying. Keep access until the period ends.
  if (data.current_period_end && new Date(data.current_period_end).getTime() < Date.now()) return null;
  if (data.status === "authenticated" && !data.current_period_start) return null;
  return data as { plan: PlanId; status: string; current_period_start: string | null; current_period_end: string | null };
}

function monthStart(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function getEntitlement(ctx: RequestContext): Promise<Entitlement | null> {
  if (ctx.mode === "local" && ctx.localKey) return localEntitlement(ctx.localKey);
  if (!ctx.user) return null;
  const admin = createAdminClient();
  if (!admin) return null;

  const sub = await activeSubscription(ctx.user.id);
  const plan: PlanId = sub && (sub.plan === "plus" || sub.plan === "pro") ? sub.plan : "free";
  const periodStart = plan === "free" ? FREE_PERIOD : sub?.current_period_start?.slice(0, 10) ?? monthStart();
  const limit = PLANS[plan].limit;

  const { data } = await admin
    .from("usage")
    .select("generation_count")
    .eq("user_id", ctx.user.id)
    .eq("period_start", periodStart)
    .maybeSingle();
  const used = data?.generation_count ?? 0;
  return {
    plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    periodStart,
    periodEnd: plan === "free" ? null : sub?.current_period_end ?? null,
    subscriptionStatus: sub?.status ?? null,
  };
}

/**
 * Atomically reserve one generation. Returns false when the allowance is used
 * up. A reservation is released again if the AI call fails, so only successful
 * generations count.
 */
export async function reserveGeneration(ctx: RequestContext, ent: Entitlement): Promise<boolean> {
  if (ctx.mode === "local" && ctx.localKey) {
    const used = localUsage.get(ctx.localKey) ?? 0;
    if (used >= ent.limit) return false;
    localUsage.set(ctx.localKey, used + 1);
    return true;
  }
  const admin = createAdminClient();
  if (!admin || !ctx.user) return false;
  const { data, error } = await admin.rpc("reserve_generation", {
    p_user_id: ctx.user.id,
    p_period_start: ent.periodStart,
    p_limit: ent.limit,
  });
  if (error) {
    console.error("[usage] reserve failed", error.message);
    throw new Error("usage_unavailable");
  }
  return data === true;
}

export async function releaseGeneration(ctx: RequestContext, ent: Entitlement): Promise<void> {
  if (ctx.mode === "local" && ctx.localKey) {
    const used = localUsage.get(ctx.localKey) ?? 0;
    localUsage.set(ctx.localKey, Math.max(0, used - 1));
    return;
  }
  const admin = createAdminClient();
  if (!admin || !ctx.user) return;
  const { error } = await admin.rpc("release_generation", { p_user_id: ctx.user.id, p_period_start: ent.periodStart });
  if (error) console.error("[usage] release failed", error.message);
}

/**
 * Records that a generation happened (for "recently used tools"). Stores a
 * short, non-sensitive summary only — never the pasted email or contract.
 * Skipped when the user has turned history off.
 */
export async function logGeneration(ctx: RequestContext, tool: ToolId, inputSummary: string): Promise<string | null> {
  if (ctx.mode !== "live" || !ctx.user) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: profile } = await admin.from("profiles").select("history_enabled").eq("id", ctx.user.id).maybeSingle();
  if (profile && profile.history_enabled === false) return null;
  const { data, error } = await admin
    .from("generations")
    .insert({ user_id: ctx.user.id, tool, input_summary: inputSummary.slice(0, 200) })
    .select("id")
    .single();
  if (error) {
    console.error("[usage] log failed", error.message);
    return null;
  }
  return data.id as string;
}

export function __resetLocalUsage() {
  localUsage.clear();
}
