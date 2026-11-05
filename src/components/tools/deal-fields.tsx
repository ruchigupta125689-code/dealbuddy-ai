"use client";

import { Field, Select, Stepper, YesNo } from "../ui/form";
import { EXCLUSIVITY_OPTIONS, USAGE_DURATIONS, type Exclusivity, type UsageDuration } from "@/lib/rates";

export interface DealTermsValue {
  reels: number;
  stories: number;
  posts: number;
  rawFootage: boolean;
  paidAds: boolean;
  usageDuration: UsageDuration;
  exclusivity: Exclusivity;
}

export function DealTermsFields<T extends DealTermsValue>({
  value,
  onChange,
  errors,
}: {
  value: T;
  onChange: <K extends keyof DealTermsValue>(k: K, v: DealTermsValue[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <>
      <div>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <Field label="Reels">
            <Stepper label="reels" value={value.reels} onChange={(v) => onChange("reels", v)} max={30} />
          </Field>
          <Field label="Stories">
            <Stepper label="stories" value={value.stories} onChange={(v) => onChange("stories", v)} max={60} />
          </Field>
          <Field label="Posts">
            <Stepper label="static posts" value={value.posts} onChange={(v) => onChange("posts", v)} max={30} />
          </Field>
        </div>
        {errors.reels && (
          <p className="mt-1.5 text-[13px] text-danger" role="alert">
            {errors.reels}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Raw footage requested?">
          <YesNo label="Raw footage" value={value.rawFootage} onChange={(v) => onChange("rawFootage", v)} />
        </Field>
        <Field label="Paid ads / whitelisting?">
          <YesNo label="Paid advertising rights" value={value.paidAds} onChange={(v) => onChange("paidAds", v)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Usage duration" htmlFor="usageDuration" hint="How long the brand can use your content.">
          <Select id="usageDuration" value={value.usageDuration} onChange={(e) => onChange("usageDuration", e.target.value as UsageDuration)}>
            {USAGE_DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Exclusivity" htmlFor="exclusivity" hint="Time you can't work with competitors.">
          <Select id="exclusivity" value={value.exclusivity} onChange={(e) => onChange("exclusivity", e.target.value as Exclusivity)}>
            {EXCLUSIVITY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </>
  );
}
