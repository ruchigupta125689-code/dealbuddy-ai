"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ChevronDown, Copy, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/form";
import { Badge } from "./ui/badge";
import { useUsage } from "./usage-provider";
import { copyText } from "@/lib/client-utils";
import { PLANS } from "@/lib/plans";
import { toolById } from "@/lib/tools/catalog";

interface SavedItem {
  id: string;
  tool: string;
  input_summary: string | null;
  output: Record<string, unknown>;
  saved_at: string | null;
  created_at: string;
}

/** Plain-text view of any saved output (all string fields, in order). */
function outputToText(o: unknown, depth = 0): string {
  if (o == null) return "";
  if (typeof o === "string") return o;
  if (typeof o === "number" || typeof o === "boolean") return String(o);
  if (Array.isArray(o)) return o.map((x) => (typeof x === "object" ? outputToText(x, depth + 1) : `- ${x}`)).join("\n");
  return Object.entries(o as Record<string, unknown>)
    .map(([k, v]) => {
      const t = outputToText(v, depth + 1);
      return t ? `${depth === 0 ? k.replace(/([A-Z])/g, " $1").toUpperCase() + "\n" : `${k}: `}${t}` : "";
    })
    .filter(Boolean)
    .join(depth === 0 ? "\n\n" : "\n");
}

export function Account() {
  const { state, refresh } = useUsage();
  const [items, setItems] = React.useState<SavedItem[] | null>(null);
  const [open, setOpen] = React.useState<string | null>(null);
  const [confirmText, setConfirmText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const router = useRouter();

  React.useEffect(() => {
    if (!state.signedIn) return;
    let alive = true;
    fetch("/api/generations", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((j) => alive && setItems(j.items ?? []))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [state.signedIn]);

  if (!state.loaded) return <div className="mx-auto max-w-3xl p-6"><div className="skeleton h-40 rounded-2xl" /></div>;

  if (!state.signedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Sign in to manage your account</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          {state.authConfigured ? "Your saved results and settings live here." : "Accounts aren't enabled on this site yet."}
        </p>
        {state.authConfigured && (
          <Button asChild className="mt-6">
            <Link href="/login?next=/account">Sign in</Link>
          </Button>
        )}
      </div>
    );
  }

  const e = state.entitlement;
  const plan = e ? PLANS[e.plan] : PLANS.free;

  async function req(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message ?? "Something went wrong");
    return json;
  }

  async function toggleHistory(v: boolean) {
    try {
      await req("/api/account", "PATCH", { historyEnabled: v });
      await refresh();
      toast.success(v ? "History turned on" : "History turned off");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function deleteItem(id: string) {
    try {
      await req(`/api/generations/${id}`, "DELETE");
      setItems((xs) => xs?.filter((x) => x.id !== id) ?? null);
      toast.success("Deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function deleteAll() {
    if (!window.confirm("Delete all saved results and tool history? This can't be undone.")) return;
    try {
      await req("/api/generations", "DELETE");
      setItems([]);
      await refresh();
      toast.success("All results and history deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function cancelSub() {
    if (!window.confirm("Cancel your subscription at the end of this billing period?")) return;
    try {
      await req("/api/billing/cancel", "POST");
      await refresh();
      toast.success("Subscription will cancel at the end of the period");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function deleteAccount() {
    setBusy(true);
    try {
      await req("/api/account", "DELETE");
      toast.success("Your account and data have been deleted");
      await refresh();
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-foreground-muted">{state.email}</p>
        </div>
        <form action="/auth/signout" method="post">
          <Button variant="outline" size="sm" type="submit">
            <LogOut /> Sign out
          </Button>
        </form>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-foreground-muted">Current plan</p>
            <p className="text-lg font-semibold">{plan.name}</p>
            {e && (
              <p className="text-sm text-foreground-muted">
                {e.used} of {e.limit} generations used{e.plan === "free" ? "" : " this period"}
                {e.periodEnd && ` · renews ${new Date(e.periodEnd).toLocaleDateString("en-IN")}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {plan.id === "free" ? (
              <Button asChild>
                <Link href="/pricing">Upgrade</Link>
              </Button>
            ) : (
              state.paymentsEnabled && (
                <Button variant="outline" onClick={cancelSub}>
                  Cancel subscription
                </Button>
              )
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span>
            <span className="block font-medium">Keep tool history</span>
            <span className="text-sm text-foreground-muted">
              Records which tools you used and a short label (never the emails or contracts you paste), to show &quot;Recently used&quot;.
            </span>
          </span>
          <input
            type="checkbox"
            className="mt-1 size-5 accent-[var(--accent)]"
            checked={state.historyEnabled}
            onChange={(ev) => toggleHistory(ev.target.checked)}
          />
        </label>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Saved results</p>
            <p className="text-sm text-foreground-muted">
              {plan.canSave ? "Results you chose to save." : "Saving results is available on Creator Plus and Pro."}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={deleteAll}>
            <Trash2 /> Delete all
          </Button>
        </div>
        {items === null ? (
          <div className="skeleton h-16 rounded-xl" />
        ) : items.length === 0 ? (
          <p className="rounded-xl bg-muted/60 p-4 text-sm text-foreground-muted">No saved results yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {items.map((it) => {
              const t = toolById(it.tool);
              const text = outputToText(it.output);
              return (
                <li key={it.id}>
                  <div className="flex items-center gap-3 p-3.5">
                    <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpen(open === it.id ? null : it.id)} aria-expanded={open === it.id}>
                      <ChevronDown className={`size-4 shrink-0 transition-transform ${open === it.id ? "rotate-180" : ""}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{it.input_summary ?? t?.name}</span>
                        <span className="text-xs text-foreground-subtle">
                          {t?.cardTitle} · {new Date(it.saved_at ?? it.created_at).toLocaleDateString("en-IN")}
                        </span>
                      </span>
                    </button>
                    <Button size="icon" variant="ghost" aria-label="Copy" onClick={() => copyText(text)}>
                      <Copy />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => deleteItem(it.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                  {open === it.id && <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t border-border bg-muted/40 p-4 font-sans text-sm leading-relaxed">{text}</pre>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="border-danger/25 p-5">
        <p className="font-medium text-danger">Delete account</p>
        <p className="mt-1 text-sm text-foreground-muted">
          Permanently deletes your account, saved results, history and usage records, and cancels any active subscription.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input placeholder='Type "DELETE" to confirm' value={confirmText} onChange={(ev) => setConfirmText(ev.target.value)} className="sm:max-w-xs" />
          <Button variant="danger" disabled={confirmText !== "DELETE" || busy} onClick={deleteAccount}>
            Delete my account
          </Button>
        </div>
      </Card>
      <p className="text-center text-xs text-foreground-subtle">
        <Badge variant="outline">Privacy</Badge> Read how we handle your data in our <Link className="underline" href="/privacy">privacy notice</Link>.
      </p>
    </div>
  );
}
