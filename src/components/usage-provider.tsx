"use client";

import * as React from "react";
import type { PlanId } from "@/lib/plans";

export interface EntitlementView {
  plan: PlanId;
  limit: number;
  used: number;
  remaining: number;
  periodStart: string;
  periodEnd: string | null;
  subscriptionStatus: string | null;
}

export interface UsageState {
  loaded: boolean;
  aiConfigured: boolean;
  authConfigured: boolean;
  paymentsEnabled: boolean;
  mode: "live" | "local" | "demo";
  demoReason: "ai_not_configured" | "signed_out" | "auth_not_configured" | null;
  signedIn: boolean;
  email: string | null;
  name: string | null;
  entitlement: EntitlementView | null;
  canSave: boolean;
  detailedMode: boolean;
  historyEnabled: boolean;
  recentTools: { tool: string; created_at: string }[];
}

const initial: UsageState = {
  loaded: false,
  aiConfigured: false,
  authConfigured: false,
  paymentsEnabled: false,
  mode: "demo",
  demoReason: null,
  signedIn: false,
  email: null,
  name: null,
  entitlement: null,
  canSave: false,
  detailedMode: false,
  historyEnabled: true,
  recentTools: [],
};

const Ctx = React.createContext<{
  state: UsageState;
  refresh: () => Promise<void>;
  setEntitlement: (e: EntitlementView) => void;
}>({ state: initial, refresh: async () => {}, setEntitlement: () => {} });

async function fetchUsage(): Promise<UsageState | null> {
  try {
    const res = await fetch("/api/usage", { cache: "no-store" });
    if (!res.ok) return null;
    return { ...initial, ...(await res.json()), loaded: true };
  } catch {
    return null;
  }
}

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<UsageState>(initial);

  const apply = React.useCallback((next: UsageState | null) => {
    setState((s) => next ?? { ...s, loaded: true });
  }, []);

  const refresh = React.useCallback(async () => {
    apply(await fetchUsage());
  }, [apply]);

  React.useEffect(() => {
    let alive = true;
    fetchUsage().then((next) => alive && apply(next));
    return () => {
      alive = false;
    };
  }, [apply]);

  const setEntitlement = React.useCallback((e: EntitlementView) => {
    setState((s) => ({ ...s, entitlement: e }));
  }, []);

  return <Ctx.Provider value={{ state, refresh, setEntitlement }}>{children}</Ctx.Provider>;
}

export const useUsage = () => React.useContext(Ctx);
