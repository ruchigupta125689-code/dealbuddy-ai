"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] text-foreground placeholder:text-foreground-subtle transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-[var(--ring)]/20 disabled:opacity-60 aria-[invalid=true]:border-danger";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, "min-h-[120px] py-3 leading-relaxed", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(fieldBase, "h-11 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle"
        fill="currentColor"
      >
        <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
      </svg>
    </div>
  ),
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional && <span className="text-xs text-foreground-subtle">Optional</span>}
      </div>
      {children}
      {error ? (
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-foreground-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

/** Pill-style single choice. Large tap targets for phones. */
export function ChoiceGroup<T extends string>({
  name,
  value,
  onChange,
  options,
  columns,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  columns?: 2 | 3;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        "grid gap-2",
        columns === 3 ? "grid-cols-2 sm:grid-cols-3" : columns === 2 ? "grid-cols-2" : "flex flex-wrap",
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-10 rounded-xl border px-3.5 py-2 text-left text-sm transition-all",
              active
                ? "border-accent bg-accent-soft font-medium text-accent"
                : "border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function YesNo({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <ChoiceGroup
      name={label}
      value={value ? "yes" : "no"}
      onChange={(v) => onChange(v === "yes")}
      options={[
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
      ]}
      columns={2}
    />
  );
}

/** Numeric input that accepts "50,000" and shows Indian digit grouping. */
export function NumberInput({
  value,
  onChange,
  prefix,
  allowDecimal,
  ...props
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  prefix?: string;
  allowDecimal?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "prefix">) {
  const display =
    value === undefined || Number.isNaN(value)
      ? ""
      : allowDecimal
        ? String(value)
        : new Intl.NumberFormat("en-IN").format(value);
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-foreground-subtle">
          {prefix}
        </span>
      )}
      <Input
        {...props}
        inputMode={allowDecimal ? "decimal" : "numeric"}
        autoComplete="off"
        value={display}
        className={cn(prefix && "pl-8", props.className)}
        onChange={(e) => {
          const raw = allowDecimal ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value.replace(/[^0-9]/g, "");
          if (raw === "") return onChange(undefined);
          if (allowDecimal && raw.endsWith(".")) return onChange(Number(raw.slice(0, -1)));
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
      />
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 50,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="flex h-11 items-center justify-between rounded-xl border border-border bg-surface px-1.5">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        className="size-8 rounded-lg text-lg text-foreground-muted hover:bg-muted disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        −
      </button>
      <span className="min-w-6 text-center text-[15px] font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        className="size-8 rounded-lg text-lg text-foreground-muted hover:bg-muted disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
