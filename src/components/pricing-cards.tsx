"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import * as React from "react";
import { Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useUsage } from "./usage-provider";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

export function PricingCards({ compact }: { compact?: boolean }) {
  const { state, refresh } = useUsage();
  const router = useRouter();
  const [busy, setBusy] = React.useState<PlanId | null>(null);
  const current = state.entitlement?.plan ?? "free";

  async function upgrade(plan: "plus" | "pro") {
    if (!state.signedIn) {
      router.push(`/signup?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? "Couldn't start checkout.");
      if (!window.Razorpay) throw new Error("Payment window didn't load. Check your connection and try again.");
      const rzp = new window.Razorpay({
        key: json.keyId,
        subscription_id: json.subscriptionId,
        name: "DealBuddy AI",
        description: `${PLANS[plan].name} — monthly`,
        prefill: { email: json.email ?? undefined },
        theme: { color: "#5b47f0" },
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          if (v.ok) {
            toast.success(`Welcome to ${PLANS[plan].name}! Your plan may take a moment to activate.`);
            await refresh();
          } else toast.error("We couldn't verify the payment. If you were charged, it will activate shortly.");
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      rzp.on("payment.failed", () => toast.error("Payment failed. You haven't been charged."));
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const tiers: PlanId[] = ["free", "plus", "pro"];
  return (
    <>
      {state.paymentsEnabled && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((id) => {
          const p = PLANS[id];
          const featured = id === "plus";
          const isCurrent = state.signedIn && current === id;
          return (
            <Card key={id} className={cn("relative flex flex-col p-6", featured && "border-accent/40 shadow-lift")}>
              {featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">Most popular</span>
              )}
              <p className="font-semibold">{p.name}</p>
              <p className="mt-1 text-sm text-foreground-muted">{p.tagline}</p>
              <p className="mt-5">
                <span className="text-4xl font-semibold tracking-tight">₹{p.priceINR}</span>
                <span className="text-sm text-foreground-muted">{id === "free" ? " forever" : " / month"}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {id === "free" ? (
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href={state.signedIn || !state.authConfigured ? "/dashboard" : "/signup"}>
                      {isCurrent ? "Your current plan" : "Try DealBuddy Free"}
                    </Link>
                  </Button>
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full" size="lg" disabled>
                    Your current plan
                  </Button>
                ) : state.paymentsEnabled ? (
                  <Button className="w-full" size="lg" variant={featured ? "default" : "dark"} onClick={() => upgrade(id)} disabled={busy !== null}>
                    {busy === id && <RefreshCw className="animate-spin" />} Upgrade to {p.name.replace("Creator ", "")}
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" variant="outline" disabled>
                    Paid plans launching soon
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-6 text-center text-sm text-foreground-muted">
          Prices in INR. Monthly plans, cancel any time. Payments are processed securely by Razorpay.
          {!state.paymentsEnabled && " Paid plans will open once billing is live — you can use the free plan today."}
        </p>
      )}
    </>
  );
}
