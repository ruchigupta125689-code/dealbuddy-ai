"use client";

import Link from "next/link";
import { ArrowRight, Clock, Info, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useUsage } from "./usage-provider";
import { PLANS } from "@/lib/plans";
import { TOOLS, toolById } from "@/lib/tools/catalog";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function Dashboard() {
  const { state } = useUsage();
  const e = state.entitlement;
  const plan = e ? PLANS[e.plan] : PLANS.free;
  const pct = e ? Math.min(100, Math.round((e.used / Math.max(1, e.limit)) * 100)) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome to DealBuddy{state.name ? `, ${state.name}` : ""}
        </h1>
        <p className="text-[15px] text-foreground-muted">Let&apos;s make your next brand collaboration smarter.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {TOOLS.map((t, i) => {
            const Icon = t.icon;
            return (
              <Link key={t.id} href={t.href} className={cn("group", i === TOOLS.length - 1 && "sm:col-span-2")}>
                <Card className="flex h-full flex-col p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-border-strong group-hover:shadow-lift">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icon className="size-5" />
                  </span>
                  <h2 className="mt-4 font-semibold tracking-tight">{t.cardTitle}</h2>
                  <p className="mt-1 flex-1 text-sm text-foreground-muted">{t.short}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    {t.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>

        <aside className="space-y-3">
          <Card className="p-5">
            {!state.loaded ? (
              <div className="space-y-3">
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-8 w-1/3 rounded" />
                <div className="skeleton h-2 w-full rounded" />
              </div>
            ) : state.mode === "demo" ? (
              <>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="size-4 text-accent" /> Demo mode
                </p>
                <p className="mt-2 text-sm text-foreground-muted">
                  {state.demoReason === "signed_out"
                    ? "You're seeing pre-written samples. Create a free account for 3 real AI generations."
                    : "Live AI isn't switched on for this site yet, so tools show pre-written samples. The rate calculator works fully."}
                </p>
                {state.demoReason === "signed_out" && (
                  <Button asChild className="mt-4 w-full">
                    <Link href="/signup">Create free account</Link>
                  </Button>
                )}
              </>
            ) : e ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{plan.name} plan</p>
                  {state.mode === "local" && <span className="text-xs text-foreground-subtle">Local preview</span>}
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
                  {e.remaining}
                  <span className="text-base font-normal text-foreground-muted"> / {e.limit}</span>
                </p>
                <p className="text-sm text-foreground-muted">
                  AI generations remaining{e.plan === "free" ? "" : " this month"}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className={cn("h-full rounded-full", e.remaining <= 1 ? "bg-warning" : "bg-accent")} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-3 text-xs text-foreground-subtle">Only successful generations count. The rate calculator is always free.</p>
              </>
            ) : (
              <p className="text-sm text-foreground-muted">Usage information is unavailable right now.</p>
            )}
          </Card>

          {(!e || e.plan === "free") && (
            <Card className="border-accent/20 bg-accent-soft/40 p-5">
              <p className="font-semibold tracking-tight">Handling deals every week?</p>
              <p className="mt-1 text-sm text-foreground-muted">
                Creator Plus gives you {PLANS.plus.limit} generations a month, saved results and detailed mode for ₹299/month.
              </p>
              <Button asChild variant="dark" className="mt-4 w-full">
                <Link href="/pricing">Upgrade plan</Link>
              </Button>
            </Card>
          )}

          {state.signedIn && state.historyEnabled && state.recentTools.length > 0 && (
            <Card className="p-5">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                <Clock className="size-4 text-foreground-muted" /> Recently used
              </p>
              <ul className="space-y-1">
                {state.recentTools.map((r) => {
                  const t = toolById(r.tool);
                  if (!t) return null;
                  const Icon = t.icon;
                  return (
                    <li key={r.tool}>
                      <Link href={t.href} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-muted">
                        <Icon className="size-4 text-foreground-muted" />
                        <span className="flex-1">{t.cardTitle}</span>
                        <span className="text-xs text-foreground-subtle" suppressHydrationWarning>
                          {timeAgo(r.created_at)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <p className="flex gap-2 px-1 text-xs leading-relaxed text-foreground-subtle">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            What you paste is sent to our AI provider (Anthropic) to generate results and isn&apos;t stored unless you save it.{" "}
            <Link href="/privacy" className="underline">Privacy</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
