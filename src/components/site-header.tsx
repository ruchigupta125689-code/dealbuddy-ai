"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { LayoutGrid, Menu, Sparkles, UserRound, X } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { useUsage } from "./usage-provider";
import { cn } from "@/lib/utils";

/** Marketing header (landing, pricing, privacy). */
export function MarketingHeader() {
  const [open, setOpen] = React.useState(false);
  const { state } = useUsage();
  const links = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-foreground-muted hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {state.signedIn ? (
            <Button asChild variant="dark" size="sm">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              {state.authConfigured && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
              <Button asChild size="sm">
                <Link href="/dashboard">Try DealBuddy Free</Link>
              </Button>
            </>
          )}
        </div>
        <button
          className="rounded-lg p-2 text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="animate-fade-up border-t border-border bg-background px-4 pb-5 pt-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 text-[15px] text-foreground">
              {l.label}
            </Link>
          ))}
          <div className="mt-3 grid gap-2">
            <Button asChild size="lg">
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Try DealBuddy Free
              </Link>
            </Button>
            {state.authConfigured && !state.signedIn && (
              <Button asChild variant="outline" size="lg">
                <Link href="/login" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function GenerationCounter({ compact }: { compact?: boolean }) {
  const { state } = useUsage();
  if (!state.loaded) return <span className="skeleton h-7 w-28 rounded-full" />;
  if (state.mode === "demo") {
    return (
      <Link
        href={state.authConfigured ? "/signup" : "/pricing"}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground-muted hover:border-border-strong"
      >
        <Sparkles className="size-3.5 text-accent" /> Demo mode
      </Link>
    );
  }
  const e = state.entitlement;
  if (!e) return null;
  const low = e.remaining <= 1;
  return (
    <Link
      href="/pricing"
      title={`${e.used} of ${e.limit} generations used${e.plan === "free" ? "" : " this month"}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tabular-nums",
        low ? "border-warning/30 bg-warning-soft text-warning" : "border-border bg-surface text-foreground-muted",
      )}
    >
      <Sparkles className="size-3.5" />
      {e.remaining} {compact ? "left" : `of ${e.limit} generations left`}
    </Link>
  );
}

/** In-app header (dashboard, tools, account). */
export function AppHeader() {
  const { state } = useUsage();
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden sm:inline-flex">
            <GenerationCounter />
          </span>
          <span className="sm:hidden">
            <GenerationCounter compact />
          </span>
          {pathname !== "/dashboard" && (
            <Button asChild variant="ghost" size="icon" aria-label="Dashboard">
              <Link href="/dashboard">
                <LayoutGrid />
              </Link>
            </Button>
          )}
          {state.signedIn ? (
            <Button asChild variant="ghost" size="icon" aria-label="Account">
              <Link href="/account">
                <UserRound />
              </Link>
            </Button>
          ) : state.authConfigured ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
