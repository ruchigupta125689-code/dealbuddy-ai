"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, Scale, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Field, NumberInput, Select, Textarea } from "../ui/form";
import { EXAMPLE_INPUTS } from "@/lib/demo";
import { NICHES } from "@/lib/niches";
import { fieldErrors, RISK_AREAS, riskInput, type RiskInput, type RiskOutput } from "@/lib/tools/schemas";
import { messageToText } from "@/lib/client-utils";
import { cn } from "@/lib/utils";
import {
  BulletList,
  DemoBanner,
  DetailedToggle,
  EditableBlock,
  EmptyState,
  FormActions,
  ResultArea,
  ResultToolbar,
  Section,
  ToolShell,
} from "./tool-shell";
import { useGenerate, useServerFieldErrors } from "./use-generate";

const STATUS = {
  green: { label: "No obvious issue", icon: CheckCircle2, cls: "text-success", badge: "green" as const },
  yellow: { label: "Needs clarification", icon: CircleAlert, cls: "text-warning", badge: "yellow" as const },
  red: { label: "Potentially unfavourable", icon: XCircle, cls: "text-danger", badge: "red" as const },
};

const OVERALL = {
  low: { label: "Low concern", variant: "green" as const },
  medium: { label: "Medium concern", variant: "yellow" as const },
  high: { label: "High concern", variant: "red" as const },
};

const areaLabel = (a: string) => RISK_AREAS.find((x) => x.value === a)?.label ?? a;

export function RiskTool() {
  const [form, setForm] = React.useState<RiskInput>({ text: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const last = React.useRef<RiskInput | null>(null);
  const gen = useGenerate("risk-check");
  useServerFieldErrors(gen.error, setErrors);
  const set = <K extends keyof RiskInput>(k: K, v: RiskInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(input: RiskInput) {
    const parsed = riskInput.safeParse(input);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    last.current = input;
    await gen.run(input);
  }

  const r = gen.data?.result;

  function toText(o: RiskOutput) {
    return [
      `OVERALL: ${OVERALL[o.overall].label}`,
      o.summary,
      "",
      "TERM-BY-TERM",
      ...o.areas.map((a) => `[${a.status.toUpperCase()}] ${areaLabel(a.area)}: ${a.finding} — ${a.whyItMatters}`),
      "",
      "RED FLAGS",
      ...o.redFlags.map((f) => `- ${f.title}${f.excerpt ? ` ("${f.excerpt}")` : ""}: ${f.whyItMatters}`),
      "",
      "QUESTIONS TO ASK THE BRAND",
      ...o.questions.map((q) => `- ${q}`),
      "",
      "SUGGESTED CHANGES",
      ...o.suggestedChanges.map((c) => `- ${c.issue}: ${c.ask}`),
      ...(o.ambiguities.length ? ["", "AMBIGUOUS WORDING", ...o.ambiguities.map((a) => `- ${a}`)] : []),
      "",
      "MESSAGE TO SEND",
      messageToText(o.message),
      "",
      "This is informational assistance, not legal advice.",
    ].join("\n");
  }

  return (
    <ToolShell
      tool="risk-check"
      form={
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(form);
          }}
        >
          <Field label="Brief, offer or contract text" htmlFor="text" error={errors.text} hint="Paste the terms. Sent to the AI for review only — not stored unless you save the result.">
            <Textarea
              id="text"
              className="min-h-[240px]"
              placeholder="Paste the deliverables, payment, usage rights, exclusivity and other terms…"
              value={form.text}
              aria-invalid={Boolean(errors.text)}
              onChange={(e) => set("text", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Proposed payment" htmlFor="proposedPayment" optional error={errors.proposedPayment}>
              <NumberInput id="proposedPayment" prefix="₹" value={form.proposedPayment} onChange={(v) => set("proposedPayment", v)} />
            </Field>
            <Field label="Your niche" htmlFor="niche" optional>
              <Select id="niche" value={form.niche ?? ""} onChange={(e) => set("niche", (e.target.value || undefined) as RiskInput["niche"])}>
                <option value="">Select niche</option>
                {NICHES.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <DetailedToggle value={Boolean(form.detailed)} onChange={(v) => set("detailed", v)} />
          <FormActions
            loading={gen.status === "loading"}
            label="Check these terms"
            onExample={() => {
              setForm(EXAMPLE_INPUTS["risk-check"]);
              setErrors({});
            }}
            note={<span>Informational only — not legal advice.</span>}
          />
        </form>
      }
      result={
        <ResultArea
          status={gen.status}
          error={gen.error}
          onRetry={() => last.current && submit(last.current)}
          loadingLabel="Reviewing every term…"
          empty={<EmptyState icon={ShieldCheck} title="Your term-by-term review will appear here" text="We check deliverables, payment, usage rights, paid ads, exclusivity, ownership, revisions, cancellation, approvals and penalties." />}
        >
          {r && gen.data && (
            <>
              {gen.data.mode === "demo" && <DemoBanner reason={gen.data.demoReason} />}
              <ResultToolbar
                tool="risk-check"
                mode={gen.data.mode}
                output={r}
                generationId={gen.data.generationId}
                filename="dealbuddy-risk-check"
                saveLabel="Deal risk check"
                getText={() => toText(r)}
                onRegenerate={() => last.current && submit(last.current)}
              />
              <Card className="p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground-muted">Overall assessment</span>
                  <Badge variant={OVERALL[r.overall].variant}>{OVERALL[r.overall].label}</Badge>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed">{r.summary}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-foreground-muted">
                  {(["green", "yellow", "red"] as const).map((s) => {
                    const S = STATUS[s];
                    const n = r.areas.filter((a) => a.status === s).length;
                    return (
                      <span key={s} className="inline-flex items-center gap-1">
                        <S.icon className={cn("size-3.5", S.cls)} /> {n} {S.label.toLowerCase()}
                      </span>
                    );
                  })}
                </div>
              </Card>

              <Section title="Term-by-term review">
                <ul className="divide-y divide-border">
                  {r.areas.map((a) => {
                    const S = STATUS[a.status];
                    return (
                      <li key={a.area} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                        <S.icon className={cn("mt-0.5 size-[18px] shrink-0", S.cls)} aria-label={S.label} />
                        <div className="min-w-0">
                          <p className="text-[15px] font-medium">{areaLabel(a.area)}</p>
                          <p className="text-sm text-foreground">{a.finding}</p>
                          <p className="mt-0.5 text-sm text-foreground-muted">{a.whyItMatters}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Section>

              {r.redFlags.length > 0 && (
                <Section title="Potential red flags">
                  <ul className="space-y-4">
                    {r.redFlags.map((f, i) => (
                      <li key={i} className="flex gap-3">
                        <AlertTriangle className={cn("mt-0.5 size-[18px] shrink-0", f.severity === "red" ? "text-danger" : "text-warning")} />
                        <div className="min-w-0">
                          <p className="text-[15px] font-medium">{f.title}</p>
                          {f.excerpt && (
                            <blockquote className="mt-1 border-l-2 border-border-strong pl-3 text-sm italic text-foreground-muted">“{f.excerpt}”</blockquote>
                          )}
                          <p className="mt-1 text-sm text-foreground-muted">{f.whyItMatters}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title="Questions to ask the brand">
                <BulletList items={r.questions} />
              </Section>

              {r.suggestedChanges.length > 0 && (
                <Section title="Suggested changes to negotiate">
                  <ul className="space-y-3">
                    {r.suggestedChanges.map((c, i) => (
                      <li key={i} className="text-[15px]">
                        <p className="font-medium">{c.issue}</p>
                        <p className="text-sm text-foreground-muted">{c.ask}</p>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {r.ambiguities.length > 0 && (
                <Section title="Ambiguous wording">
                  <BulletList items={r.ambiguities} />
                </Section>
              )}

              <EditableBlock
                title="Message to send the brand"
                subject={r.message.subject}
                body={r.message.body}
                onChange={(m) => gen.updateResult((p) => ({ ...p, message: m }))}
              />

              <div className="flex gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm text-foreground-muted">
                <Scale className="mt-0.5 size-4 shrink-0" />
                <p>
                  This is informational assistance, not legal advice. DealBuddy can&apos;t tell you whether an agreement is legally valid.
                  {r.legalReviewRecommended && (
                    <span className="font-medium text-foreground"> Given what this document covers, consider having a lawyer review it before signing.</span>
                  )}
                </p>
              </div>
            </>
          )}
        </ResultArea>
      }
    />
  );
}
