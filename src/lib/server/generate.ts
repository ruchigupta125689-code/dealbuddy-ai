import "server-only";
import type { z } from "zod";
import { DEMO_OUTPUTS, templateRateOutput } from "../demo";
import { defaultAssumptions, estimateRate, type RateEstimate } from "../rates";
import {
  TOOL_SCHEMAS,
  type NegotiateOutput,
  type ToolId,
  type negotiateInput,
  type pitchInput,
  type rateInput,
  type replyInput,
  type riskInput,
} from "../tools/schemas";
import { formatINR } from "../utils";
import {
  buildNegotiateMessage,
  buildPitchMessage,
  buildRateMessage,
  buildReplyMessage,
  buildRiskMessage,
} from "../ai/user-message";

type In<T extends ToolId> = z.output<(typeof TOOL_SCHEMAS)[T]["input"]>;

export function computeEstimate(tool: ToolId, input: unknown): RateEstimate | undefined {
  if (tool === "negotiate") {
    const i = input as z.output<typeof negotiateInput>;
    return estimateRate({ ...i, avgStoryViews: undefined, engagementRate: undefined });
  }
  if (tool === "rate-calculator") {
    const i = input as z.output<typeof rateInput>;
    return estimateRate(i, i.assumptions ?? defaultAssumptions(i.niche));
  }
  return undefined;
}

export function buildUserMessage(tool: ToolId, input: unknown, estimate?: RateEstimate): string {
  switch (tool) {
    case "reply":
      return buildReplyMessage(input as z.output<typeof replyInput>);
    case "negotiate":
      return buildNegotiateMessage(input as z.output<typeof negotiateInput>, estimate!);
    case "risk-check":
      return buildRiskMessage(input as z.output<typeof riskInput>);
    case "pitch":
      return buildPitchMessage(input as z.output<typeof pitchInput>);
    case "rate-calculator":
      return buildRateMessage(input as z.output<typeof rateInput>, estimate!);
  }
}

export function demoOutput(tool: ToolId, input: unknown, estimate?: RateEstimate): unknown {
  if (tool === "rate-calculator") {
    const i = input as In<"rate-calculator">;
    return templateRateOutput(estimate!, i);
  }
  return DEMO_OUTPUTS[tool];
}

/** Short, non-sensitive description for history. Never includes pasted emails/contracts. */
export function inputSummary(tool: ToolId, input: unknown): string {
  switch (tool) {
    case "reply": {
      const i = input as In<"reply">;
      return `Reply · ${i.goal.replace("_", " ")} · ${i.tone}${i.refine ? ` · ${i.refine.action.replace("_", " ")}` : ""}`;
    }
    case "negotiate": {
      const i = input as In<"negotiate">;
      return `Offer ${formatINR(i.proposedPayment)} · ${i.reels} reel, ${i.stories} story, ${i.posts} post`;
    }
    case "risk-check": {
      const i = input as In<"risk-check">;
      return `Reviewed ${i.text.length.toLocaleString("en-IN")} characters of terms`;
    }
    case "pitch": {
      const i = input as In<"pitch">;
      return `Pitch to ${i.brandName.slice(0, 60)}`;
    }
    case "rate-calculator": {
      const i = input as In<"rate-calculator">;
      return `${i.followers.toLocaleString("en-IN")} followers · ${i.reels} reel, ${i.stories} story, ${i.posts} post`;
    }
  }
}

/** Light post-processing so numbers are always coherent for the UI. */
export function normaliseOutput(tool: ToolId, output: unknown): unknown {
  if (tool === "negotiate") {
    const o = output as NegotiateOutput;
    const [low, high] = [Math.round(o.counterOffer.low), Math.round(o.counterOffer.high)].sort((a, b) => a - b);
    const anchor = Math.max(low, Math.round(o.counterOffer.anchor));
    return { ...o, counterOffer: { ...o.counterOffer, low, high, anchor } };
  }
  return output;
}
