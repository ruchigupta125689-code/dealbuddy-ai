"use client";

import * as React from "react";
import { Handshake } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Field, NumberInput, Select, Textarea } from "../ui/form";
import { EXAMPLE_INPUTS } from "@/lib/demo";
import { NICHES, type Niche } from "@/lib/niches";
import { fieldErrors, negotiateInput, type NegotiateInput, type NegotiateOutput } from "@/lib/tools/schemas";
import { messageToText } from "@/lib/client-utils";
import { formatINR } from "@/lib/utils";
import { DealTermsFields } from "./deal-fields";
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

type Form = Omit<NegotiateInput, "proposedPayment" | "followers" | "niche"> & {
  proposedPayment?: number;
  followers?: number;
  niche?: Niche;
};

const EMPTY: Form = {
  reels: 1,
  stories: 0,
  posts: 0,
  rawFootage: false,
  paidAds: false,
  usageDuration: "unspecified",
  exclusivity: "unspecified",
};

const VERDICT: Record<NegotiateOutput["verdict"], { label: string; variant: "red" | "yellow" | "green" | "default" }> = {
  well_below: { label: "Well below estimate", variant: "red" },
  below: { label: "Below estimate", variant: "yellow" },
  fair: { label: "Within estimate", variant: "green" },
  above: { label: "Above estimate", variant: "green" },
  unclear: { label: "Not enough information", variant: "default" },
};

const SEVERITY = { high: "red", medium: "yellow", low: "default" } as const;

export function NegotiateTool() {
  const [form, setForm] = React.useState<Form>(EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const last = React.useRef<Form | null>(null);
  const gen = useGenerate("negotiate");
  useServerFieldErrors(gen.error, setErrors);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(input: Form) {
    const parsed = negotiateInput.safeParse(input);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    last.current = input;
    await gen.run(input);
  }

  const r = gen.data?.result;
  const est = gen.data?.estimate;

  function toText(o: NegotiateOutput) {
    return [
      `OFFER ASSESSMENT: ${VERDICT[o.verdict].label}`,
      o.assessment,
      "",
      `SUGGESTED COUNTEROFFER (indicative): ${formatINR(o.counterOffer.low)} – ${formatINR(o.counterOffer.high)}; open at ${formatINR(o.counterOffer.anchor)}`,
      o.counterOffer.rationale,
      "",
      "POTENTIAL ISSUES",
      ...o.issues.map((i) => `- [${i.severity}] ${i.title}: ${i.detail}`),
      "",
      "NEGOTIATION STRATEGY",
      ...o.strategy.map((s, i) => `${i + 1}. ${s}`),
      "",
      "MESSAGE TO SEND",
      messageToText(o.message),
      "",
      "CLARIFY BEFORE AGREEING",
      ...o.clarify.map((c) => `- ${c}`),
      "",
      "ASSUMPTIONS",
      ...o.assumptions.map((c) => `- ${c}`),
      ...(o.missingInfo.length ? ["", "MISSING INFORMATION", ...o.missingInfo.map((c) => `- ${c}`)] : []),
    ].join("\n");
  }

  return (
    <ToolShell
      tool="negotiate"
      form={
        <form noValidate className="space-y-5" onSubmit={(e) => (e.preventDefault(), void submit(form))}>
          <Field label="Brand's proposed payment" htmlFor="proposedPayment" error={errors.proposedPayment} hint="Enter 0 if it's barter / product only.">
            <NumberInput id="proposedPayment" prefix="₹" placeholder="10,000" value={form.proposedPayment} onChange={(v) => set("proposedPayment", v)} aria-invalid={Boolean(errors.proposedPayment)} />
          </Field>
          <DealTermsFields value={form} onChange={(k, v) => set(k, v as never)} errors={errors} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your followers" htmlFor="followers" error={errors.followers}>
              <NumberInput id="followers" placeholder="25,000" value={form.followers} onChange={(v) => set("followers", v)} aria-invalid={Boolean(errors.followers)} />
            </Field>
            <Field label="Average views per reel" htmlFor="avgReelViews" optional error={errors.avgReelViews}>
              <NumberInput id="avgReelViews" placeholder="8,000" value={form.avgReelViews} onChange={(v) => set("avgReelViews", v)} />
            </Field>
            <Field label="Your niche" htmlFor="niche" error={errors.niche}>
              <Select id="niche" value={form.niche ?? ""} aria-invalid={Boolean(errors.niche)} onChange={(e) => set("niche", (e.target.value || undefined) as Niche)}>
                <option value="">Select niche</option>
                {NICHES.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Your minimum payment" htmlFor="minPayment" optional error={errors.minPayment}>
              <NumberInput id="minPayment" prefix="₹" placeholder="15,000" value={form.minPayment} onChange={(v) => set("minPayment", v)} />
            </Field>
          </div>
          <Field label="Other terms from the brief" htmlFor="otherTerms" optional error={errors.otherTerms} hint="E.g. payment timelines, revisions. Not stored.">
            <Textarea id="otherTerms" className="min-h-[90px]" value={form.otherTerms ?? ""} onChange={(e) => set("otherTerms", e.target.value)} />
          </Field>
          <DetailedToggle value={Boolean(form.detailed)} onChange={(v) => set("detailed", v)} />
          <FormActions
            loading={gen.status === "loading"}
            label="Assess this offer"
            onExample={() => {
              setForm(EXAMPLE_INPUTS.negotiate as Form);
              setErrors({});
            }}
          />
        </form>
      }
      result={
        <ResultArea
          status={gen.status}
          error={gen.error}
          onRetry={() => last.current && submit(last.current)}
          loadingLabel="Assessing the offer…"
          empty={<EmptyState icon={Handshake} title="Your negotiation plan will appear here" text="Enter the brand's offer and what they're asking for. You'll get an honest assessment, a counteroffer range and a message to send." />}
        >
          {r && gen.data && (
            <>
              {gen.data.mode === "demo" && <DemoBanner reason={gen.data.demoReason} />}
              <ResultToolbar
                tool="negotiate"
                mode={gen.data.mode}
                output={r}
                generationId={gen.data.generationId}
                filename="dealbuddy-negotiation"
                saveLabel={`Offer ${formatINR(form.proposedPayment ?? 0)}`}
                getText={() => toText(r)}
                onRegenerate={() => last.current && submit(last.current)}
              />
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={VERDICT[r.verdict].variant}>{VERDICT[r.verdict].label}</Badge>
                  {est && <span className="text-xs text-foreground-subtle">Indicative estimate for this scope: {formatINR(est.total.low)} – {formatINR(est.total.high)}</span>}
                </div>
                <p className="mt-3 text-[15px] leading-relaxed">{r.assessment}</p>
                <div className="mt-4 rounded-xl bg-muted/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Suggested counteroffer · indicative</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                    {formatINR(r.counterOffer.low)} – {formatINR(r.counterOffer.high)}
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Open at <span className="font-semibold text-foreground">{formatINR(r.counterOffer.anchor)}</span>. {r.counterOffer.rationale}
                  </p>
                </div>
              </Card>
              {r.issues.length > 0 && (
                <Section title="Potential issues with this offer">
                  <ul className="space-y-3">
                    {r.issues.map((i, idx) => (
                      <li key={idx} className="flex gap-3">
                        <Badge variant={SEVERITY[i.severity]} className="mt-0.5 h-fit shrink-0 capitalize">
                          {i.severity}
                        </Badge>
                        <div>
                          <p className="text-[15px] font-medium">{i.title}</p>
                          <p className="text-sm text-foreground-muted">{i.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              <Section title="Negotiation strategy">
                <BulletList items={r.strategy} ordered />
              </Section>
              <EditableBlock
                title="Ready-to-send message"
                subject={r.message.subject}
                body={r.message.body}
                onChange={(m) => gen.updateResult((p) => ({ ...p, message: m }))}
              />
              <Section title="Clarify before you agree">
                <BulletList items={r.clarify} />
              </Section>
              <Section title="Assumptions & missing information">
                <BulletList items={[...r.assumptions, ...r.missingInfo.map((m) => `Missing: ${m}`)]} />
                <p className="mt-3 text-xs text-foreground-subtle">
                  Figures are indicative suggestions based on the information you provided — not verified market rates.
                </p>
              </Section>
            </>
          )}
        </ResultArea>
      }
    />
  );
}
