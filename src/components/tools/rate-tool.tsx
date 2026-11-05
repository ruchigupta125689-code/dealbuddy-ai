"use client";

import * as React from "react";
import { AlertTriangle, Calculator, ChevronDown, RotateCcw, SlidersHorizontal, Wand2, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Field, NumberInput, Select } from "../ui/form";
import { EXAMPLE_INPUTS } from "@/lib/demo";
import { NICHES, type Niche } from "@/lib/niches";
import { defaultAssumptions, estimateRate, type RateAssumptions, type RateEstimate } from "@/lib/rates";
import { fieldErrors, rateInput, type RateInputForm, type RateOutput } from "@/lib/tools/schemas";
import { messageToText } from "@/lib/client-utils";
import { cn, formatINR } from "@/lib/utils";
import { DealTermsFields } from "./deal-fields";
import { BulletList, DemoBanner, EditableBlock, ErrorState, LimitCard, LoadingState, ResultToolbar, Section, ToolShell } from "./tool-shell";
import { useGenerate, useServerFieldErrors } from "./use-generate";

type Form = Omit<RateInputForm, "followers" | "niche" | "assumptions"> & { followers?: number; niche?: Niche };

const EMPTY: Form = {
  reels: 1,
  stories: 0,
  posts: 0,
  rawFootage: false,
  paidAds: false,
  usageDuration: "none",
  exclusivity: "none",
};

export function RateTool() {
  const [form, setForm] = React.useState<Form>(EMPTY);
  const [assumptions, setAssumptions] = React.useState<RateAssumptions | null>(null);
  const [showAssumptions, setShowAssumptions] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState(false);
  const gen = useGenerate("rate-calculator");
  useServerFieldErrors(gen.error, setErrors);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const effectiveAssumptions = assumptions ?? defaultAssumptions(form.niche ?? "other");
  const payload = { ...form, assumptions: assumptions ?? undefined };
  const parsed = rateInput.safeParse(payload);

  // Cheap pure calculation — recomputed on every change so results stay live.
  const estimate: RateEstimate | null = parsed.success ? estimateRate(parsed.data, effectiveAssumptions) : null;

  function calculate() {
    setTouched(true);
    if (!parsed.success) setErrors(fieldErrors(parsed.error));
    else setErrors({});
  }

  async function writeMessage() {
    calculate();
    if (!parsed.success) return;
    await gen.run(payload);
  }

  const editA = <K extends keyof RateAssumptions>(k: K, v: RateAssumptions[K]) =>
    setAssumptions({ ...effectiveAssumptions, [k]: v });

  const dur = form.usageDuration === "unspecified" ? "3m" : form.usageDuration;
  const excl = form.exclusivity === "unspecified" ? "none" : form.exclusivity;

  const r = gen.data?.result;
  const toText = (o: RateOutput, e: RateEstimate) =>
    [
      `INDICATIVE RANGE: ${formatINR(e.total.low)} – ${formatINR(e.total.high)}`,
      `Suggested starting quote: ${formatINR(e.startingQuote)}`,
      `Suggested minimum acceptable quote: ${formatINR(e.minimumQuote)}`,
      "",
      "BREAKDOWN",
      ...e.lines.map((l) => `- ${l.label} (${l.kind === "content" ? "content" : "rights/licensing"}): ${formatINR(l.low)} – ${formatINR(l.high)}`),
      "",
      o.summary,
      "",
      "ASSUMPTIONS",
      ...o.explanation.map((x) => `- ${x}`),
      "",
      "QUOTE MESSAGE",
      messageToText(o.negotiationMessage),
      "",
      "These are indicative suggestions based on your inputs, not guaranteed market prices.",
    ].join("\n");

  return (
    <ToolShell
      tool="rate-calculator"
      form={
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            calculate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instagram followers" htmlFor="followers" error={errors.followers}>
              <NumberInput id="followers" placeholder="30,000" value={form.followers} aria-invalid={Boolean(errors.followers)} onChange={(v) => set("followers", v)} />
            </Field>
            <Field label="Average reel views" htmlFor="avgReelViews" error={errors.avgReelViews} hint="Biggest driver of price. Estimated if left blank.">
              <NumberInput id="avgReelViews" placeholder="12,000" value={form.avgReelViews} onChange={(v) => set("avgReelViews", v)} />
            </Field>
            <Field label="Average story views" htmlFor="avgStoryViews" optional error={errors.avgStoryViews}>
              <NumberInput id="avgStoryViews" value={form.avgStoryViews} onChange={(v) => set("avgStoryViews", v)} />
            </Field>
            <Field label="Engagement rate (%)" htmlFor="engagementRate" optional error={errors.engagementRate}>
              <NumberInput id="engagementRate" allowDecimal placeholder="4.5" value={form.engagementRate} onChange={(v) => set("engagementRate", v)} />
            </Field>
          </div>
          <Field label="Your niche" htmlFor="niche" error={errors.niche}>
            <Select
              id="niche"
              value={form.niche ?? ""}
              aria-invalid={Boolean(errors.niche)}
              onChange={(e) => {
                const n = (e.target.value || undefined) as Niche | undefined;
                set("niche", n);
                if (assumptions && n) setAssumptions({ ...assumptions, nicheMultiplier: defaultAssumptions(n).nicheMultiplier });
              }}
            >
              <option value="">Select niche</option>
              {NICHES.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </Select>
          </Field>
          <DealTermsFields value={form} onChange={(k, v) => set(k, v as never)} errors={errors} />

          <div className="rounded-xl border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium"
              aria-expanded={showAssumptions}
              onClick={() => setShowAssumptions((s) => !s)}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-foreground-muted" /> Edit pricing assumptions
                {assumptions && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">Custom</span>}
              </span>
              <ChevronDown className={cn("size-4 transition-transform", showAssumptions && "rotate-180")} />
            </button>
            {showAssumptions && (
              <div className="space-y-4 border-t border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="₹ per 1,000 views (low)" htmlFor="a-low">
                    <NumberInput id="a-low" prefix="₹" value={effectiveAssumptions.ratePer1kViewsLow} onChange={(v) => editA("ratePer1kViewsLow", v ?? 0)} />
                  </Field>
                  <Field label="₹ per 1,000 views (high)" htmlFor="a-high" error={errors.assumptions}>
                    <NumberInput id="a-high" prefix="₹" value={effectiveAssumptions.ratePer1kViewsHigh} onChange={(v) => editA("ratePer1kViewsHigh", v ?? 0)} />
                  </Field>
                  <Field label="Minimum fee per reel" htmlFor="a-min">
                    <NumberInput id="a-min" prefix="₹" value={effectiveAssumptions.minReelFee} onChange={(v) => editA("minReelFee", v ?? 0)} />
                  </Field>
                  <Field label="Niche multiplier" htmlFor="a-niche">
                    <NumberInput id="a-niche" allowDecimal value={effectiveAssumptions.nicheMultiplier} onChange={(v) => editA("nicheMultiplier", v ?? 1)} />
                  </Field>
                  <Field label="Story price (% of a reel)" htmlFor="a-story">
                    <NumberInput id="a-story" value={effectiveAssumptions.storyPctOfReel} onChange={(v) => editA("storyPctOfReel", v ?? 0)} />
                  </Field>
                  <Field label="Static post price (% of a reel)" htmlFor="a-post">
                    <NumberInput id="a-post" value={effectiveAssumptions.postPctOfReel} onChange={(v) => editA("postPctOfReel", v ?? 0)} />
                  </Field>
                  <Field label="Views estimate (% of followers)" htmlFor="a-ratio" hint="Used only if reel views are blank.">
                    <NumberInput
                      id="a-ratio"
                      value={Math.round(effectiveAssumptions.fallbackViewRatio * 100)}
                      onChange={(v) => editA("fallbackViewRatio", (v ?? 0) / 100)}
                    />
                  </Field>
                  <Field label="Raw footage (+% of content)" htmlFor="a-raw">
                    <NumberInput id="a-raw" value={effectiveAssumptions.rawFootagePct} onChange={(v) => editA("rawFootagePct", v ?? 0)} />
                  </Field>
                  {dur !== "none" && (
                    <Field label={`${form.paidAds ? "Paid ads" : "Brand usage"} for ${dur} (+%)`} htmlFor="a-usage">
                      <NumberInput
                        id="a-usage"
                        value={(form.paidAds ? effectiveAssumptions.paidUsagePct : effectiveAssumptions.organicUsagePct)[dur]}
                        onChange={(v) =>
                          form.paidAds
                            ? editA("paidUsagePct", { ...effectiveAssumptions.paidUsagePct, [dur]: v ?? 0 })
                            : editA("organicUsagePct", { ...effectiveAssumptions.organicUsagePct, [dur]: v ?? 0 })
                        }
                      />
                    </Field>
                  )}
                  {excl !== "none" && (
                    <Field label={`Exclusivity for ${excl} (+%)`} htmlFor="a-excl">
                      <NumberInput
                        id="a-excl"
                        value={effectiveAssumptions.exclusivityPct[excl]}
                        onChange={(v) => editA("exclusivityPct", { ...effectiveAssumptions.exclusivityPct, [excl]: v ?? 0 })}
                      />
                    </Field>
                  )}
                </div>
                {assumptions && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAssumptions(null)}>
                    <RotateCcw /> Reset to defaults
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-border pt-5">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="submit" size="lg" variant="outline">
                <Calculator /> Calculate (free)
              </Button>
              <Button type="button" size="lg" onClick={writeMessage} disabled={gen.status === "loading"}>
                {gen.status === "loading" ? <RefreshCw className="animate-spin" /> : <Wand2 />}
                {gen.status === "loading" ? "Writing…" : "Write quote message"}
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-foreground-subtle">
              <button
                type="button"
                className="font-medium text-accent hover:underline"
                onClick={() => {
                  setForm(EXAMPLE_INPUTS["rate-calculator"] as Form);
                  setAssumptions(null);
                  setErrors({});
                  setTouched(true);
                }}
              >
                Fill with an example
              </button>
              <span>Calculating is free · AI message uses 1 generation</span>
            </div>
          </div>
        </form>
      }
      result={
        <div className="space-y-4">
          {estimate ? (
            <EstimateCard estimate={estimate} />
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border-strong/70 bg-surface/50 p-8 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground-subtle">
                <Calculator className="size-5" />
              </span>
              <p className="mt-4 font-medium">Your indicative rate will appear here</p>
              <p className="mt-1 max-w-xs text-sm text-foreground-muted">
                {touched && !parsed.success
                  ? "Fill in the highlighted fields to see your estimate."
                  : "Add your follower count, niche and deliverables. The estimate updates as you type."}
              </p>
            </div>
          )}
          {gen.status === "loading" && <LoadingState label="Writing your quote message…" />}
          {gen.status === "error" && gen.error &&
            (gen.error.code === "limit_reached" ? <LimitCard message={gen.error.message} /> : <ErrorState error={gen.error} onRetry={writeMessage} />)}
          {gen.status === "success" && r && gen.data?.estimate && (
            <div className="animate-fade-up space-y-4">
              {gen.data.mode === "demo" && (
                <DemoBanner reason={gen.data.demoReason} />
              )}
              {gen.data.mode === "demo" && (
                <p className="text-[13px] text-foreground-muted">
                  The numbers above are real calculations. The message below is a fill-in template, not AI-written.
                </p>
              )}
              <ResultToolbar
                tool="rate-calculator"
                mode={gen.data.mode}
                output={r}
                generationId={gen.data.generationId}
                filename="dealbuddy-rate-quote"
                saveLabel={`Quote ${formatINR(gen.data.estimate.startingQuote)}`}
                getText={() => toText(r, gen.data!.estimate!)}
                onRegenerate={writeMessage}
              />
              <Section title="What this means">
                <p className="mb-3 text-[15px] leading-relaxed">{r.summary}</p>
                <BulletList items={r.explanation} />
              </Section>
              <EditableBlock
                title={gen.data.mode === "demo" ? "Quote message (template)" : "Quote message"}
                subject={r.negotiationMessage.subject}
                body={r.negotiationMessage.body}
                onChange={(m) => gen.updateResult((p) => ({ ...p, negotiationMessage: m }))}
              />
              {r.tips.length > 0 && (
                <Section title="Tips">
                  <BulletList items={r.tips} />
                </Section>
              )}
            </div>
          )}
        </div>
      }
    />
  );
}

function EstimateCard({ estimate: e }: { estimate: RateEstimate }) {
  const content = e.lines.filter((l) => l.kind === "content");
  const rights = e.lines.filter((l) => l.kind === "rights");
  return (
    <Card className="animate-fade-up overflow-hidden">
      <div className="p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Indicative range</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums sm:text-[34px]">
          {formatINR(e.total.low)} – {formatINR(e.total.high)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-accent-soft p-3.5">
            <p className="text-xs text-accent">Suggested starting quote</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatINR(e.startingQuote)}</p>
          </div>
          <div className="rounded-xl bg-muted p-3.5">
            <p className="text-xs text-foreground-muted">Suggested minimum</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatINR(e.minimumQuote)}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border p-5 sm:p-6">
        <p className="mb-2 text-sm font-semibold">Content creation fee</p>
        <Lines lines={content} />
        <Total label="Content subtotal" low={e.contentFee.low} high={e.contentFee.high} />
        {rights.length > 0 && (
          <>
            <p className="mb-2 mt-5 text-sm font-semibold">Licensing, exclusivity & paid ads (charged separately)</p>
            <Lines lines={rights} />
            <Total label="Rights subtotal" low={e.rightsFee.low} high={e.rightsFee.high} />
          </>
        )}
      </div>
      {(e.warnings.length > 0 || e.missing.length > 0) && (
        <div className="space-y-2 border-t border-border bg-warning-soft/40 p-5 text-sm sm:px-6">
          {[...e.warnings, ...e.missing.map((m) => `Missing: ${m}`)].map((w, i) => (
            <p key={i} className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> <span>{w}</span>
            </p>
          ))}
        </div>
      )}
      <details className="group border-t border-border p-5 text-sm sm:px-6">
        <summary className="cursor-pointer list-none font-medium text-foreground-muted group-open:text-foreground">
          How this was calculated
        </summary>
        <ul className="mt-3 space-y-1.5 text-foreground-muted">
          {e.assumptionNotes.map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
          <li>• Rights fees are calculated as a percentage of the content fee.</li>
          <li>• These are indicative suggestions, not guaranteed or verified market rates. Adjust the assumptions to match your experience.</li>
        </ul>
      </details>
    </Card>
  );
}

function Lines({ lines }: { lines: RateEstimate["lines"] }) {
  return (
    <ul className="space-y-2">
      {lines.map((l) => (
        <li key={l.label} className="flex items-start justify-between gap-3 text-sm">
          <span>
            <span className="text-foreground">{l.label}</span>
            <span className="block text-xs text-foreground-subtle">{l.note}</span>
          </span>
          <span className="shrink-0 tabular-nums text-foreground-muted">
            {formatINR(l.low)} – {formatINR(l.high)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Total({ label, low, high }: { label: string; low: number; high: number }) {
  return (
    <div className="mt-3 flex justify-between border-t border-dashed border-border pt-2.5 text-sm font-medium">
      <span>{label}</span>
      <span className="tabular-nums">
        {formatINR(low)} – {formatINR(high)}
      </span>
    </div>
  );
}
