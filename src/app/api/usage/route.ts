import { NextResponse } from "next/server";
import { isAIConfigured, isPaymentsConfigured, isSupabaseConfigured } from "@/lib/config";
import { PLANS } from "@/lib/plans";
import { clientIp } from "@/lib/server/rate-limit";
import { getEntitlement, resolveContext } from "@/lib/server/usage";
import { createUserClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const context = await resolveContext(clientIp(req));
  let entitlement = null;
  try {
    entitlement = context.mode === "demo" ? null : await getEntitlement(context);
  } catch {
    entitlement = null;
  }

  let recentTools: { tool: string; created_at: string }[] = [];
  let historyEnabled = true;
  let name: string | null = null;
  if (context.user) {
    const supabase = await createUserClient();
    if (supabase) {
      const [{ data: gens }, { data: profile }] = await Promise.all([
        supabase.from("generations").select("tool, created_at").order("created_at", { ascending: false }).limit(20),
        supabase.from("profiles").select("name, history_enabled").maybeSingle(),
      ]);
      historyEnabled = profile?.history_enabled !== false;
      name = profile?.name ?? null;
      const seen = new Set<string>();
      for (const g of gens ?? []) {
        if (!seen.has(g.tool)) {
          seen.add(g.tool);
          recentTools.push(g);
        }
      }
      recentTools = recentTools.slice(0, 3);
    }
  }

  const plan = entitlement ? PLANS[entitlement.plan] : PLANS.free;
  return NextResponse.json(
    {
      aiConfigured: isAIConfigured(),
      authConfigured: isSupabaseConfigured(),
      paymentsEnabled: isPaymentsConfigured(),
      mode: context.mode,
      demoReason: context.demoReason ?? null,
      signedIn: Boolean(context.user),
      email: context.user?.email ?? null,
      name,
      entitlement,
      canSave: context.mode === "live" && plan.canSave,
      detailedMode: context.mode !== "demo" && plan.detailedMode,
      historyEnabled,
      recentTools,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
