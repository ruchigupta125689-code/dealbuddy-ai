"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Check,
  Copy,
  Download,
  Info,
  Lock,
  Pencil,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Textarea } from "../ui/form";
import { useUsage } from "../usage-provider";
import { copyText, downloadText } from "@/lib/client-utils";
import { toolById } from "@/lib/tools/catalog";
import type { ToolId } from "@/lib/tools/schemas";
import { cn } from "@/lib/utils";
import type { GenError, GenStatus } from "./use-generate";

export function ToolShell({
  tool,
  form,
  result,
}: {
  tool: ToolId;
  form: React.ReactNode;
  result: React.ReactNode;
}) {
  const meta = toolById(tool)!;
  const Icon = meta.icon;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
      <Link href="/dashboard" className="mb-5 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> All tools
      </Link>
      <div className="mb-6 flex items-start gap-3.5 sm:mb-8">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{meta.name}</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-foreground-muted">{meta.description}</p>
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6">
        <Card className="p-4 sm:p-6">{form}</Card>
        <div className="lg:sticky lg:top-24">{result}</div>
      </div>
    </div>
  );
}

export function FormActions({
  loading,
  label,
  onExample,
  note,
}: {
  loading: boolean;
  label: string;
  onExample?: () => void;
  note?: React.ReactNode;
}) {
  return (
    <div className="space-y-3 border-t border-border pt-5">
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <RefreshCw className="animate-spin" /> : <Wand2 />}
        {loading ? "Generating…" : label}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-foreground-subtle">
        {onExample ? (
          <button type="button" onClick={onExample} className="font-medium text-accent hover:underline">
            Fill with an example
          </button>
        ) : (
          <span />
        )}
        {note}
      </div>
    </div>
  );
}

export function DetailedToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { state } = useUsage();
  const allowed = state.detailedMode;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/50 p-3.5 text-sm",
        !allowed && "cursor-default opacity-80",
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 accent-[var(--accent)]"
        checked={allowed && value}
        disabled={!allowed}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="flex items-center gap-1.5 font-medium">
          Detailed mode {!allowed && <Lock className="size-3.5 text-foreground-subtle" />}
        </span>
        <span className="text-foreground-muted">
          {allowed ? "Deeper analysis and fuller explanations." : (
            <>
              Available on <Link href="/pricing" className="text-accent hover:underline">Creator Plus and Pro</Link>.
            </>
          )}
        </span>
      </span>
    </label>
  );
}

export function DemoBanner({ reason }: { reason?: string }) {
  const { state } = useUsage();
  const text =
    reason === "signed_out"
      ? "This is a pre-written sample, not a live AI result. Create a free account to get 3 real AI generations on your own deals."
      : reason === "ai_not_configured"
        ? "This is a pre-written sample, not a live AI result. Live AI generation isn't switched on for this site yet."
        : "This is a pre-written sample, not a live AI result.";
  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-soft/60 p-3.5 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-accent" />
      <div className="space-y-2">
        <p>
          <span className="font-semibold text-accent">Demo sample.</span> {text}
        </p>
        {reason === "signed_out" && state.authConfigured && (
          <Button asChild size="sm">
            <Link href="/signup">Create free account</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function LimitCard({ message }: { message: string }) {
  return (
    <Card className="animate-fade-up border-accent/25 p-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Sparkles className="size-5" />
      </span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">You&apos;re out of generations</h3>
      <p className="mt-1.5 text-[15px] text-foreground-muted">{message}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/pricing">See plans from ₹299/month</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/tools/rate-calculator">Use the free rate calculator</Link>
        </Button>
      </div>
    </Card>
  );
}

export function LoadingState({ label = "Writing your result…" }: { label?: string }) {
  return (
    <Card className="p-5 sm:p-6" aria-busy="true" aria-live="polite">
      <div className="mb-5 flex items-center gap-2.5 text-sm text-foreground-muted">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
        </span>
        {label}
      </div>
      <div className="space-y-3">
        <div className="skeleton h-4 w-2/5 rounded-md" />
        <div className="skeleton h-3.5 w-full rounded-md" />
        <div className="skeleton h-3.5 w-11/12 rounded-md" />
        <div className="skeleton h-3.5 w-4/5 rounded-md" />
        <div className="h-2" />
        <div className="skeleton h-3.5 w-full rounded-md" />
        <div className="skeleton h-3.5 w-3/4 rounded-md" />
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border-strong/70 bg-surface/50 p-8 text-center lg:min-h-[420px]">
      <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground-subtle">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-foreground-muted">{text}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: GenError; onRetry?: () => void }) {
  return (
    <Card className="animate-fade-up border-danger/25 p-5" role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" />
        <div className="space-y-3">
          <p className="text-[15px]">{error.message}</p>
          {onRetry && error.code !== "invalid_input" && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw /> Try again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Wrapper that renders the right state for a tool's result column. */
export function ResultArea({
  status,
  error,
  empty,
  onRetry,
  loadingLabel,
  children,
}: {
  status: GenStatus;
  error: GenError | null;
  empty: React.ReactNode;
  onRetry?: () => void;
  loadingLabel?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  // On phones the result sits below the form — bring it into view when generation starts.
  React.useEffect(() => {
    if (status === "loading" && window.innerWidth < 1024) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);
  let content: React.ReactNode;
  if (status === "loading") content = <LoadingState label={loadingLabel} />;
  else if (status === "error" && error)
    content = error.code === "limit_reached" ? <LimitCard message={error.message} /> : <ErrorState error={error} onRetry={onRetry} />;
  else if (status === "success") content = <div className="animate-fade-up space-y-4">{children}</div>;
  else content = empty;
  return (
    <div ref={ref} className="scroll-mt-20">
      {content}
    </div>
  );
}

export function ResultToolbar({
  getText,
  filename,
  onRegenerate,
  tool,
  generationId,
  output,
  saveLabel,
  mode,
}: {
  getText: () => string;
  filename: string;
  onRegenerate?: () => void;
  tool: ToolId;
  generationId?: string | null;
  output: unknown;
  saveLabel?: string;
  mode: string;
}) {
  const { state } = useUsage();
  const router = useRouter();
  // Saved state is tied to the exact output object; a new/edited result resets it.
  const [savedOutput, setSavedOutput] = React.useState<unknown>(null);
  const saved = savedOutput !== null && savedOutput === output;
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!state.canSave) {
      toast("Saving results is part of Creator Plus and Pro.", {
        action: { label: "See plans", onClick: () => router.push("/pricing") },
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, generationId, output, label: saveLabel }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? "Couldn't save");
      setSavedOutput(output);
      toast.success("Saved to your account");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="dark" onClick={() => copyText(getText(), "Copied full result")}>
        <Copy /> Copy all
      </Button>
      {onRegenerate && (
        <Button size="sm" variant="outline" onClick={onRegenerate}>
          <RefreshCw /> Regenerate
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => downloadText(getText(), filename)}>
        <Download /> Download .txt
      </Button>
      {mode === "live" && (
        <Button size="sm" variant="ghost" onClick={save} disabled={saving || saved}>
          {saved ? <Check /> : state.canSave ? <Bookmark /> : <Lock />} {saved ? "Saved" : "Save"}
        </Button>
      )}
    </div>
  );
}

/** A message the user can copy or edit in place. */
export function EditableBlock({
  title,
  subject,
  body,
  onChange,
  hint,
}: {
  title: string;
  subject?: string | null;
  body: string;
  onChange: (next: { subject: string | null; body: string }) => void;
  hint?: React.ReactNode;
}) {
  const [editing, setEditing] = React.useState(false);
  const hasSubject = subject !== undefined && subject !== null;
  const text = hasSubject ? `Subject: ${subject}\n\n${body}` : body;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5 sm:px-5">
        <p className="text-sm font-semibold">{title}</p>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
            {editing ? <Check /> : <Pencil />} {editing ? "Done" : "Edit"}
          </Button>
          <Button size="sm" variant="soft" onClick={() => copyText(text)}>
            <Copy /> Copy
          </Button>
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        {editing ? (
          <>
            {hasSubject && (
              <input
                aria-label="Subject"
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm font-medium focus:border-accent focus:outline-none"
                value={subject ?? ""}
                onChange={(e) => onChange({ subject: e.target.value, body })}
              />
            )}
            <Textarea
              aria-label={`${title} text`}
              className="min-h-[280px] text-[15px]"
              value={body}
              onChange={(e) => onChange({ subject: subject ?? null, body: e.target.value })}
            />
          </>
        ) : (
          <>
            {hasSubject && (
              <p className="text-sm">
                <span className="text-foreground-subtle">Subject: </span>
                <span className="font-medium">{subject}</span>
              </p>
            )}
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{highlightPlaceholders(body)}</div>
          </>
        )}
        {hint}
      </div>
    </Card>
  );
}

/** Highlights [placeholders] so creators notice what to fill in. */
export function highlightPlaceholders(text: string): React.ReactNode[] {
  return text.split(/(\[[^\]\n]{1,60}\])/g).map((part, i) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <mark key={i} className="rounded bg-warning-soft px-1 text-warning">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

export function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </Card>
  );
}

export function BulletList({ items, ordered }: { items: string[]; ordered?: boolean }) {
  if (!items.length) return <p className="text-sm text-foreground-subtle">Nothing to add.</p>;
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
          <span className={cn("mt-[0.55rem] shrink-0", ordered ? "hidden" : "size-1.5 rounded-full bg-foreground-subtle")} />
          {ordered && <span className="w-5 shrink-0 font-medium tabular-nums text-foreground-subtle">{i + 1}.</span>}
          <span>{t}</span>
        </li>
      ))}
    </Tag>
  );
}
