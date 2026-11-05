"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { ChoiceGroup, Field, Input, NumberInput, Select, Textarea } from "../ui/form";
import { EXAMPLE_INPUTS } from "@/lib/demo";
import { NICHES, type Niche } from "@/lib/niches";
import { COLLAB_TYPES, fieldErrors, pitchInput, TONES, type PitchInput, type PitchOutput } from "@/lib/tools/schemas";
import {
  DemoBanner,
  DetailedToggle,
  EditableBlock,
  EmptyState,
  FormActions,
  ResultArea,
  ResultToolbar,
  ToolShell,
} from "./tool-shell";
import { useGenerate, useServerFieldErrors } from "./use-generate";

type Form = Omit<PitchInput, "followers" | "niche"> & { followers?: number; niche?: Niche };

const EMPTY: Form = {
  creatorName: "",
  instagramHandle: "",
  brandName: "",
  brandCategory: "",
  collabType: "sponsored_reel",
  tone: "friendly",
};
const TONE_OPTIONS = TONES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }));

export function PitchTool() {
  const [form, setForm] = React.useState<Form>(EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const last = React.useRef<Form | null>(null);
  const gen = useGenerate("pitch");
  useServerFieldErrors(gen.error, setErrors);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(input: Form) {
    const parsed = pitchInput.safeParse(input);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    last.current = input;
    await gen.run(input);
  }

  const r = gen.data?.result;
  const toText = (o: PitchOutput) =>
    [`EMAIL\nSubject: ${o.subject}\n\n${o.fullEmail}`, `INSTAGRAM DM\n${o.dm}`, `FOLLOW-UP (5–7 days later)\n${o.followUp}`].join("\n\n---\n\n");

  return (
    <ToolShell
      tool="pitch"
      form={
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(form);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" htmlFor="creatorName" error={errors.creatorName}>
              <Input id="creatorName" value={form.creatorName} aria-invalid={Boolean(errors.creatorName)} onChange={(e) => set("creatorName", e.target.value)} />
            </Field>
            <Field label="Instagram username" htmlFor="instagramHandle" optional error={errors.instagramHandle}>
              <Input id="instagramHandle" placeholder="@yourhandle" autoCapitalize="none" value={form.instagramHandle ?? ""} onChange={(e) => set("instagramHandle", e.target.value)} />
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
            <Field label="Followers" htmlFor="followers" error={errors.followers}>
              <NumberInput id="followers" placeholder="20,000" value={form.followers} aria-invalid={Boolean(errors.followers)} onChange={(v) => set("followers", v)} />
            </Field>
            <Field label="Average reel views" htmlFor="avgReelViews" optional error={errors.avgReelViews}>
              <NumberInput id="avgReelViews" value={form.avgReelViews} onChange={(v) => set("avgReelViews", v)} />
            </Field>
            <Field label="Engagement rate (%)" htmlFor="engagementRate" optional error={errors.engagementRate}>
              <NumberInput id="engagementRate" allowDecimal placeholder="4.5" value={form.engagementRate} onChange={(v) => set("engagementRate", v)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand name" htmlFor="brandName" error={errors.brandName}>
              <Input id="brandName" value={form.brandName} aria-invalid={Boolean(errors.brandName)} onChange={(e) => set("brandName", e.target.value)} />
            </Field>
            <Field label="Brand category" htmlFor="brandCategory" error={errors.brandCategory}>
              <Input id="brandCategory" placeholder="e.g. Sustainable activewear" value={form.brandCategory} aria-invalid={Boolean(errors.brandCategory)} onChange={(e) => set("brandCategory", e.target.value)} />
            </Field>
          </div>
          <Field label="Type of collaboration" htmlFor="collabType">
            <Select id="collabType" value={form.collabType} onChange={(e) => set("collabType", e.target.value as Form["collabType"])}>
              {COLLAB_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tone">
            <ChoiceGroup name="Tone" value={form.tone} onChange={(v) => set("tone", v)} options={TONE_OPTIONS} />
          </Field>
          <Field
            label="Anything else that's true about you"
            htmlFor="aboutYou"
            optional
            error={errors.aboutYou}
            hint="Audience city, content style, past brand work. We only use what you write here — nothing is made up."
          >
            <Textarea id="aboutYou" className="min-h-[90px]" value={form.aboutYou ?? ""} onChange={(e) => set("aboutYou", e.target.value)} />
          </Field>
          <DetailedToggle value={Boolean(form.detailed)} onChange={(v) => set("detailed", v)} />
          <FormActions
            loading={gen.status === "loading"}
            label="Write my pitch"
            onExample={() => {
              setForm(EXAMPLE_INPUTS.pitch as Form);
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
          loadingLabel="Writing your pitch…"
          empty={<EmptyState icon={Send} title="Your pitch will appear here" text="You'll get an email, a short Instagram DM and a follow-up — using only the details you provide." />}
        >
          {r && gen.data && (
            <>
              {gen.data.mode === "demo" && <DemoBanner reason={gen.data.demoReason} />}
              <ResultToolbar
                tool="pitch"
                mode={gen.data.mode}
                output={r}
                generationId={gen.data.generationId}
                filename="dealbuddy-brand-pitch"
                saveLabel={`Pitch to ${form.brandName}`}
                getText={() => toText(r)}
                onRegenerate={() => last.current && submit(last.current)}
              />
              <EditableBlock
                title="Pitch email"
                subject={r.subject}
                body={r.fullEmail}
                onChange={(m) => gen.updateResult((p) => ({ ...p, subject: m.subject ?? "", fullEmail: m.body }))}
                hint={
                  r.placeholders.length > 0 && (
                    <p className="text-[13px] text-foreground-muted">Fill in before sending: {r.placeholders.join(", ")}</p>
                  )
                }
              />
              <EditableBlock title="Instagram DM" body={r.dm} onChange={(m) => gen.updateResult((p) => ({ ...p, dm: m.body }))} />
              <EditableBlock title="Follow-up (if no reply in 5–7 days)" body={r.followUp} onChange={(m) => gen.updateResult((p) => ({ ...p, followUp: m.body }))} />
            </>
          )}
        </ResultArea>
      }
    />
  );
}
