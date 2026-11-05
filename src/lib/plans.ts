/** Plan definitions shared by the pricing UI and the server-side quota logic. */

export type PlanId = "free" | "plus" | "pro";

function envInt(name: string, fallback: number): number {
  const raw = typeof process !== "undefined" ? process.env[name] : undefined;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceINR: number;
  /** Generations allowed. Free = lifetime per account, paid = per billing month. */
  limit: number;
  limitPeriod: "lifetime" | "month";
  tagline: string;
  features: string[];
  canSave: boolean;
  detailedMode: boolean;
  priority: boolean;
}

// Limits are read on the server; the NEXT_PUBLIC_ fallbacks let the pricing page show the same numbers.
export const PLUS_LIMIT = envInt("PLAN_PLUS_MONTHLY_LIMIT", envInt("NEXT_PUBLIC_PLAN_PLUS_MONTHLY_LIMIT", 60));
export const PRO_LIMIT = envInt("PLAN_PRO_MONTHLY_LIMIT", envInt("NEXT_PUBLIC_PLAN_PRO_MONTHLY_LIMIT", 200));
export const FREE_LIMIT = 3;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceINR: 0,
    limit: FREE_LIMIT,
    limitPeriod: "lifetime",
    tagline: "Try every tool on a real deal.",
    features: [`${FREE_LIMIT} AI generations`, "Access to all five tools", "Standard outputs", "Unlimited rate calculations"],
    canSave: false,
    detailedMode: false,
    priority: false,
  },
  plus: {
    id: "plus",
    name: "Creator Plus",
    priceINR: 299,
    limit: PLUS_LIMIT,
    limitPeriod: "month",
    tagline: "For creators handling deals every week.",
    features: [
      `${PLUS_LIMIT} AI generations / month`,
      "All five tools",
      "Save results to your account",
      "Detailed mode for deeper analysis",
    ],
    canSave: true,
    detailedMode: true,
    priority: false,
  },
  pro: {
    id: "pro",
    name: "Creator Pro",
    priceINR: 599,
    limit: PRO_LIMIT,
    limitPeriod: "month",
    tagline: "For full-time creators and small talent teams.",
    features: [
      `${PRO_LIMIT} AI generations / month`,
      "Priority generation (higher rate limits)",
      "Detailed mode for deeper analysis",
      "Saved history of results",
    ],
    canSave: true,
    detailedMode: true,
    priority: true,
  },
};
