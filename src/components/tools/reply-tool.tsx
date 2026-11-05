"use client";

import * as React from "react";
import { Lightbulb, MailOpen, Minimize2, RefreshCw, Smile, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ChoiceGroup, Field, Input, Select, Textarea } from "../ui/form";
import { EXAMPLE_INPUTS } from "@/lib/demo";
import { NICHES } from "@/lib/niches";
import { fieldErrors, replyInput, REFINE_ACTIONS, TONES, type ReplyInput } from "@/lib/tools/schemas";
import { messageToText } from "@/lib/client-utils";
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

const GOALS = [
  { value: "accept", label: "Accept collaboration" },
  { value: "negotiate", label: "Negotiate payment" },
  { value: "more_details", label: "Ask for more details" },
  { value: "decline", label: "Politely decline" },
  { value: "higher_budget", label: "Request a higher budget" },
] as const;

const TONE_OPTIONS = TONES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }));

const EMPTY: ReplyInput = { brandEmail: "", creatorName: "", tone: "professional", goal: "accept" };

export function ReplyTool() {
  const [form, setForm] = React.useState<ReplyInput>(EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const lastInput = React.useRef<ReplyInput | null>(null);
  const gen = useGenerate("reply");
  useServerFieldErrors(gen.error, setErrors);
  const set = <K extends keyof ReplyInput>(k: K, v: ReplyInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(input: ReplyInput) {
    const parsed = replyInput.safeParse(input);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    lastInput.current = { ...input, refine: undefined };
    await gen.run(input);
  }

  function refine(action: (typeof REFINE_ACTIONS)[number]) {
    if (!gen.data || !lastInput.current) return;
    if (gen.data.mode === "demo") {
      toast("Refinements need live AI. In demo mode you'll see the same sample.");
      return;
    }
    void gen.run({
      ...lastInput.current,
      refine: { action, previous: { subject: gen.data.result.subject, body: gen.data.result.body } },
    });
  }

  const r = gen.data?.result;

  return (
    <ToolShell
      tool="reply"
      form={
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(form);
          }}
        >
          <Field label="Brand email or message" htmlFor="brandEmail" error={errors.brandEmail} hint="Paste the full email or DM. It's only sent to the AI to write your reply — it isn't stored.">
            <Textarea
              id="brandEmail"
              placeholder="Hi! We loved your content and would like to collaborate…"
              className="min-h-[180px]"
              value={form.brandEmail}
              aria-invalid={Boolean(errors.brandEmail)}
              onChange={(e) => set("brandEmail", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" htmlFor="creatorName" optional error={errors.creatorName}>
              <Input id="creatorName" autoComplete="given-name" value={form.creatorName ?? ""} onChange={(e) => set("creatorName", e.target.value)} />
            </Field>
            <Field label="Your niche" htmlFor="creatorNiche" optional>
              <Select
                id="creatorNiche"
                value={form.creatorNiche ?? ""}
                onChange={(e) => set("creatorNiche", (e.target.value || undefined) as ReplyInput["creatorNiche"])}
              >
                <option value="">Select niche</option>
                {NICHES.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="What do you want to do?">
            <ChoiceGroup name="Desired response" value={form.goal} onChange={(v) => set("goal", v)} options={GOALS} columns={2} />
          </Field>
          <Field label="Tone">
            <ChoiceGroup name="Tone" value={form.tone} onChange={(v) => set("tone", v)} options={TONE_OPTIONS} />
          </Field>
          <DetailedToggle value={Boolean(form.detailed)} onChange={(v) => set("detailed", v)} />
          <FormActions
            loading={gen.status === "loading"}
            label="Write my reply"
            onExample={() => {
              setForm(EXAMPLE_INPUTS.reply);
              setErrors({});
            }}
          />
        </form>
      }
      result={
        <ResultArea
          status={gen.status}
          error={gen.error}
          onRetry={() => lastInput.current && submit(lastInput.current)}
          loadingLabel="Writing your reply…"
          empty={<EmptyState icon={MailOpen} title="Your reply will appear here" text="Paste a brand's message, choose what you want to do, and DealBuddy writes a ready-to-send reply." />}
        >
          {r && gen.data && (
            <>
              {gen.data.mode === "demo" && <DemoBanner reason={gen.data.demoReason} />}
              <ResultToolbar
                tool="reply"
                mode={gen.data.mode}
                output={r}
                generationId={gen.data.generationId}
                filename="dealbuddy-brand-reply"
                saveLabel={`Reply · ${form.goal.replace("_", " ")}`}
                getText={() => messageToText(r)}
                onRegenerate={() => refine("regenerate")}
              />
              <EditableBlock
                title="Your reply"
                subject={r.subject}
                body={r.body}
                onChange={(m) => gen.updateResult((prev) => ({ ...prev, ...m }))}
                hint={
                  r.placeholders.length > 0 && (
                    <p className="text-[13px] text-foreground-muted">
                      Fill in the highlighted placeholders before sending: {r.placeholders.join(", ")}
                    </p>
                  )
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => refine("shorter")}>
                  <Minimize2 /> Make it shorter
                </Button>
                <Button size="sm" variant="outline" onClick={() => refine("more_professional")}>
                  <Sparkles /> More professional
                </Button>
                <Button size="sm" variant="outline" onClick={() => refine("friendlier")}>
                  <Smile /> Friendlier
                </Button>
                <Button size="sm" variant="ghost" onClick={() => refine("regenerate")}>
                  <RefreshCw /> Another version
                </Button>
              </div>
              {gen.data.mode !== "demo" && (
                <p className="text-xs text-foreground-subtle">Each refinement uses 1 generation.</p>
              )}
              {r.tips.length > 0 && (
                <Section title="Things to watch">
                  <div className="flex gap-2.5">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
                    <BulletList items={r.tips} />
                  </div>
                </Section>
              )}
            </>
          )}
        </ResultArea>
      }
    />
  );
}
