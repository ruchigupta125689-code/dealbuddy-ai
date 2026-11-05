"use client";

import * as React from "react";
import type { RateEstimate } from "@/lib/rates";
import type { ToolId, ToolOutput } from "@/lib/tools/schemas";
import { useUsage, type EntitlementView } from "../usage-provider";

export type GenStatus = "idle" | "loading" | "success" | "error";

export interface GenData<T extends ToolId> {
  result: ToolOutput[T];
  estimate?: RateEstimate;
  mode: "live" | "local" | "demo";
  demoReason?: "ai_not_configured" | "signed_out" | "auth_not_configured";
  generationId?: string | null;
  detailed?: boolean;
}

export interface GenError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export function useGenerate<T extends ToolId>(tool: T) {
  const { setEntitlement, refresh } = useUsage();
  const [status, setStatus] = React.useState<GenStatus>("idle");
  const [data, setData] = React.useState<GenData<T> | null>(null);
  const [error, setError] = React.useState<GenError | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const run = React.useCallback(
    async (body: unknown): Promise<GenData<T> | null> => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setStatus("loading");
      setError(null);
      try {
        const res = await fetch(`/api/generate/${tool}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json) {
          const e: GenError = {
            code: json?.error ?? "network",
            message: json?.message ?? "Something went wrong. Please check your connection and try again.",
            fields: json?.fields,
          };
          if (json?.entitlement) setEntitlement(json.entitlement as EntitlementView);
          setError(e);
          setStatus("error");
          return null;
        }
        if (json.entitlement) setEntitlement(json.entitlement as EntitlementView);
        else if (json.mode !== "demo") void refresh();
        setData(json as GenData<T>);
        setStatus("success");
        return json as GenData<T>;
      } catch (e) {
        if ((e as Error).name === "AbortError") return null;
        setError({ code: "network", message: "Couldn't reach DealBuddy. Check your connection and try again." });
        setStatus("error");
        return null;
      }
    },
    [tool, setEntitlement, refresh],
  );

  const updateResult = React.useCallback((updater: (r: ToolOutput[T]) => ToolOutput[T]) => {
    setData((d) => (d ? { ...d, result: updater(d.result) } : d));
  }, []);

  return { status, data, error, run, updateResult, setError };
}

/** Copies field-level validation errors returned by the server into a form. */
export function useServerFieldErrors(error: GenError | null, setErrors: (e: Record<string, string>) => void) {
  React.useEffect(() => {
    if (error?.fields) setErrors(error.fields);
  }, [error, setErrors]);
}
