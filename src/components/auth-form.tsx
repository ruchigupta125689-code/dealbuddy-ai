"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { MailCheck, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Field, Input } from "./ui/form";
import { Logo } from "./logo";
import { useUsage } from "./usage-provider";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type Mode = "login" | "signup" | "forgot" | "reset";

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  login: { title: "Welcome back", sub: "Sign in to DealBuddy.", cta: "Sign in" },
  signup: { title: "Create your free account", sub: "3 free AI generations. No card needed.", cta: "Create account" },
  forgot: { title: "Reset your password", sub: "We'll email you a reset link.", cta: "Send reset link" },
  reset: { title: "Choose a new password", sub: "Enter a new password for your account.", cta: "Update password" },
};

const ERROR_PARAMS: Record<string, string> = {
  link_invalid: "That link is invalid or has expired. Please try again.",
  auth_not_configured: "Accounts aren't enabled on this site yet.",
};

function safeNext(n: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { refresh } = useUsage();
  const supabase = getBrowserSupabase();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const errorParam = params.get("error");
  const [error, setError] = React.useState<string | null>(errorParam ? ERROR_PARAMS[errorParam] ?? null : null);
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const c = COPY[mode];

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!supabase) return;
    setError(null);
    if (mode !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if ((mode === "signup" || mode === "reset") && password.length < 8) return setError("Use at least 8 characters for your password.");
    if (mode === "login" && !password) return setError("Enter your password.");

    setLoading(true);
    const origin = window.location.origin;
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refresh();
        router.push(next);
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() || undefined }, emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        if (data.session) {
          await refresh();
          router.push(next);
          router.refresh();
        } else setSent(true);
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await refresh();
        router.push("/dashboard");
      }
    } catch (err) {
      const msg = (err as Error).message || "Something went wrong.";
      setError(
        /invalid login/i.test(msg)
          ? "That email and password don't match."
          : /already registered/i.test(msg)
            ? "An account with this email already exists. Try signing in."
            : /session/i.test(msg) && mode === "reset"
              ? "Your reset link has expired. Request a new one."
              : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card className="p-6">
          {!supabase ? (
            <div className="space-y-4 text-center">
              <h1 className="text-lg font-semibold">Accounts aren&apos;t enabled yet</h1>
              <p className="text-sm text-foreground-muted">This site hasn&apos;t connected Supabase. You can still explore every tool in demo mode.</p>
              <Button asChild className="w-full">
                <Link href="/dashboard">Try the demo</Link>
              </Button>
            </div>
          ) : sent ? (
            <div className="space-y-3 text-center">
              <MailCheck className="mx-auto size-10 text-accent" />
              <h1 className="text-lg font-semibold">Check your email</h1>
              <p className="text-sm text-foreground-muted">
                {mode === "signup" ? "Confirm your email to finish creating your account." : "If an account exists, a password reset link is on its way."}
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="mb-2">
                <h1 className="text-lg font-semibold tracking-tight">{c.title}</h1>
                <p className="text-sm text-foreground-muted">{c.sub}</p>
              </div>
              {mode === "signup" && (
                <Field label="Name" htmlFor="name" optional>
                  <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
              )}
              {mode !== "reset" && (
                <Field label="Email" htmlFor="email">
                  <Input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
              )}
              {mode !== "forgot" && (
                <Field label={mode === "reset" ? "New password" : "Password"} htmlFor="password">
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              )}
              {error && (
                <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading && <RefreshCw className="animate-spin" />} {c.cta}
              </Button>
              {mode === "login" && (
                <div className="flex justify-between text-sm">
                  <Link href="/forgot-password" className="text-foreground-muted hover:text-foreground">
                    Forgot password?
                  </Link>
                  <Link href={`/signup${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent">
                    Create account
                  </Link>
                </div>
              )}
              {mode === "signup" && (
                <p className="text-center text-sm text-foreground-muted">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-accent">
                    Sign in
                  </Link>
                </p>
              )}
              {mode === "forgot" && (
                <p className="text-center text-sm">
                  <Link href="/login" className="text-foreground-muted hover:text-foreground">
                    Back to sign in
                  </Link>
                </p>
              )}
            </form>
          )}
        </Card>
        <p className="mt-6 text-center text-sm text-foreground-muted">
          Just looking?{" "}
          <Link href="/dashboard" className="font-medium text-foreground underline-offset-2 hover:underline">
            Try the demo without an account
          </Link>
        </p>
      </div>
    </div>
  );
}
