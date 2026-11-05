/**
 * Input and output schemas for the five tools. Shared by the browser (form
 * validation) and the server (request validation + AI output validation).
 */
import { z } from "zod";
import { NICHE_VALUES } from "../niches";
import { EXCLUSIVITY_VALUES, USAGE_DURATION_VALUES } from "../rates";

export const TOOL_IDS = ["reply", "negotiate", "risk-check", "pitch", "rate-calculator"] as const;
export type ToolId = (typeof TOOL_IDS)[number];

export const TONES = ["professional", "friendly", "confident", "premium", "casual"] as const;
export type Tone = (typeof TONES)[number];

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

const count = (max: number) => z.number().int("Whole numbers only").min(0).max(max, `Maximum is ${max}`);
const optPositive = (max: number, label: string) =>
  z.number().int().min(0).max(max, `${label} looks too high`).optional();

const followersField = z
  .number({ error: "Enter your follower count" })
  .int()
  .min(100, "Enter at least 100 followers")
  .max(100_000_000, "Follower count looks too high");

const niche = z.enum(NICHE_VALUES, { error: "Choose a niche" });
const optNiche = z.enum(NICHE_VALUES).optional();

/** Paid tiers may ask for a more thorough answer. Enforced server-side by plan. */
const detailed = z.boolean().optional();

const messageSchema = z.object({
  subject: z.string().max(200).nullable(),
  body: z.string().min(1).max(6000),
});

/* ------------------------------------------------------------------ */
/* 1. Brand email reply                                                */
/* ------------------------------------------------------------------ */

export const REPLY_GOALS = ["accept", "negotiate", "more_details", "decline", "higher_budget"] as const;

export const replyOutput = z.object({
  subject: z.string().max(200).nullable(),
  body: z.string().min(1).max(6000),
  placeholders: z.array(z.string().max(120)).max(10),
  tips: z.array(z.string().max(300)).max(4),
});
export type ReplyOutput = z.infer<typeof replyOutput>;

export const REFINE_ACTIONS = ["regenerate", "shorter", "more_professional", "friendlier"] as const;

export const replyInput = z.object({
  brandEmail: z
    .string()
    .trim()
    .min(20, "Paste the brand's email or message (at least 20 characters)")
    .max(8000, "That message is too long — paste the most relevant part (max 8,000 characters)"),
  creatorName: optText(80),
  creatorNiche: optNiche,
  tone: z.enum(TONES),
  goal: z.enum(REPLY_GOALS),
  detailed,
  refine: z
    .object({
      action: z.enum(REFINE_ACTIONS),
      previous: replyOutput.pick({ subject: true, body: true }),
    })
    .optional(),
});
export type ReplyInput = z.input<typeof replyInput>;

/* ------------------------------------------------------------------ */
/* 2. Deal negotiation                                                 */
/* ------------------------------------------------------------------ */

const dealTerms = {
  reels: count(30),
  stories: count(60),
  posts: count(30),
  rawFootage: z.boolean(),
  paidAds: z.boolean(),
  usageDuration: z.enum(USAGE_DURATION_VALUES),
  exclusivity: z.enum(EXCLUSIVITY_VALUES),
};

export const negotiateInput = z
  .object({
    proposedPayment: z
      .number({ error: "Enter the brand's offer in ₹ (enter 0 for barter/product only)" })
      .int()
      .min(0)
      .max(100_000_000, "That amount looks too high"),
    ...dealTerms,
    followers: followersField,
    avgReelViews: optPositive(500_000_000, "Average views"),
    niche,
    minPayment: optPositive(100_000_000, "Minimum payment"),
    otherTerms: optText(2000),
    detailed,
  })
  .refine((v) => v.reels + v.stories + v.posts > 0, {
    message: "Add at least one deliverable (reel, story or post)",
    path: ["reels"],
  });
export type NegotiateInput = z.input<typeof negotiateInput>;

export const negotiateOutput = z.object({
  verdict: z.enum(["well_below", "below", "fair", "above", "unclear"]),
  assessment: z.string().min(1).max(1500),
  issues: z
    .array(
      z.object({
        title: z.string().max(120),
        detail: z.string().max(600),
        severity: z.enum(["low", "medium", "high"]),
      }),
    )
    .max(8),
  counterOffer: z.object({
    low: z.number().min(0),
    high: z.number().min(0),
    anchor: z.number().min(0),
    rationale: z.string().max(800),
  }),
  strategy: z.array(z.string().max(400)).min(1).max(7),
  message: messageSchema,
  clarify: z.array(z.string().max(300)).max(10),
  assumptions: z.array(z.string().max(400)).max(8),
  missingInfo: z.array(z.string().max(300)).max(8),
});
export type NegotiateOutput = z.infer<typeof negotiateOutput>;

/* ------------------------------------------------------------------ */
/* 3. Risk checker                                                     */
/* ------------------------------------------------------------------ */

export const RISK_AREAS = [
  { value: "deliverables", label: "Deliverables" },
  { value: "payment_terms", label: "Payment terms" },
  { value: "payment_deadlines", label: "Payment deadlines" },
  { value: "usage_rights", label: "Usage rights" },
  { value: "paid_ads", label: "Paid ads & whitelisting" },
  { value: "exclusivity", label: "Exclusivity" },
  { value: "usage_duration", label: "Duration of content usage" },
  { value: "ownership", label: "Content ownership" },
  { value: "revisions", label: "Revisions" },
  { value: "cancellation", label: "Cancellation" },
  { value: "approval", label: "Content approval" },
  { value: "penalties", label: "Penalties & extra obligations" },
] as const;
const RISK_AREA_VALUES = RISK_AREAS.map((a) => a.value) as [
  (typeof RISK_AREAS)[number]["value"],
  ...(typeof RISK_AREAS)[number]["value"][],
];

export const riskInput = z.object({
  text: z
    .string()
    .trim()
    .min(50, "Paste the brief, offer or contract text (at least 50 characters)")
    .max(15000, "That's too long — paste the key sections (max 15,000 characters)"),
  proposedPayment: optPositive(100_000_000, "Payment"),
  niche: optNiche,
  detailed,
});
export type RiskInput = z.input<typeof riskInput>;

export const riskOutput = z.object({
  overall: z.enum(["low", "medium", "high"]),
  summary: z.string().min(1).max(1200),
  areas: z
    .array(
      z.object({
        area: z.enum(RISK_AREA_VALUES),
        status: z.enum(["green", "yellow", "red"]),
        finding: z.string().max(600),
        whyItMatters: z.string().max(600),
      }),
    )
    .min(1)
    .max(12),
  redFlags: z
    .array(
      z.object({
        title: z.string().max(160),
        excerpt: z.string().max(400).nullable(),
        whyItMatters: z.string().max(700),
        severity: z.enum(["yellow", "red"]),
      }),
    )
    .max(10),
  questions: z.array(z.string().max(300)).max(10),
  suggestedChanges: z
    .array(z.object({ issue: z.string().max(200), ask: z.string().max(500) }))
    .max(10),
  message: messageSchema,
  ambiguities: z.array(z.string().max(400)).max(8),
  legalReviewRecommended: z.boolean(),
});
export type RiskOutput = z.infer<typeof riskOutput>;

/* ------------------------------------------------------------------ */
/* 4. Brand pitch                                                      */
/* ------------------------------------------------------------------ */

export const COLLAB_TYPES = [
  { value: "sponsored_reel", label: "Sponsored reel" },
  { value: "ugc", label: "UGC content (for brand's page/ads)" },
  { value: "product_review", label: "Product review" },
  { value: "story_campaign", label: "Story campaign" },
  { value: "ambassador", label: "Long-term ambassador" },
  { value: "event", label: "Event / launch coverage" },
  { value: "other", label: "Open to ideas" },
] as const;
const COLLAB_VALUES = COLLAB_TYPES.map((c) => c.value) as [
  (typeof COLLAB_TYPES)[number]["value"],
  ...(typeof COLLAB_TYPES)[number]["value"][],
];

export const pitchInput = z.object({
  creatorName: z.string().trim().min(1, "Enter your name").max(80),
  instagramHandle: optText(40),
  niche,
  followers: followersField,
  avgReelViews: optPositive(500_000_000, "Average views"),
  engagementRate: z.number().min(0).max(100, "Engagement rate should be a percentage").optional(),
  brandName: z.string().trim().min(1, "Enter the brand name").max(80),
  brandCategory: z.string().trim().min(2, "Enter the brand's category").max(80),
  collabType: z.enum(COLLAB_VALUES),
  tone: z.enum(TONES),
  aboutYou: optText(1200),
  detailed,
});
export type PitchInput = z.input<typeof pitchInput>;

export const pitchOutput = z.object({
  subject: z.string().min(1).max(200),
  opening: z.string().max(800),
  introduction: z.string().max(800),
  brandRelevance: z.string().max(800),
  collaborationIdea: z.string().max(1200),
  callToAction: z.string().max(500),
  closing: z.string().max(400),
  fullEmail: z.string().min(1).max(5000),
  dm: z.string().min(1).max(1000),
  followUp: z.string().min(1).max(1500),
  placeholders: z.array(z.string().max(120)).max(8),
});
export type PitchOutput = z.infer<typeof pitchOutput>;

/* ------------------------------------------------------------------ */
/* 5. Rate calculator                                                  */
/* ------------------------------------------------------------------ */

const pctRecord = <K extends string>(keys: readonly K[]) =>
  z.object(Object.fromEntries(keys.map((k) => [k, z.number().min(0).max(1000)])) as Record<K, z.ZodNumber>);

export const assumptionsSchema = z.object({
  ratePer1kViewsLow: z.number().min(0).max(100000),
  ratePer1kViewsHigh: z.number().min(0).max(100000),
  fallbackViewRatio: z.number().min(0).max(5),
  minReelFee: z.number().min(0).max(10_000_000),
  storyPctOfReel: z.number().min(0).max(500),
  postPctOfReel: z.number().min(0).max(500),
  nicheMultiplier: z.number().min(0.1).max(10),
  rawFootagePct: z.number().min(0).max(1000),
  organicUsagePct: pctRecord(["none", "1m", "3m", "6m", "12m", "perpetual"] as const),
  paidUsagePct: pctRecord(["none", "1m", "3m", "6m", "12m", "perpetual"] as const),
  exclusivityPct: pctRecord(["none", "1m", "3m", "6m", "12m"] as const),
});

export const rateInput = z
  .object({
    followers: followersField,
    avgReelViews: optPositive(500_000_000, "Average views"),
    avgStoryViews: optPositive(500_000_000, "Story views"),
    engagementRate: z.number().min(0).max(100, "Engagement rate should be a percentage").optional(),
    niche,
    ...dealTerms,
    assumptions: assumptionsSchema.optional(),
    detailed,
  })
  .refine((v) => v.reels + v.stories + v.posts > 0, {
    message: "Add at least one deliverable (reel, story or post)",
    path: ["reels"],
  })
  .refine((v) => !v.assumptions || v.assumptions.ratePer1kViewsHigh >= v.assumptions.ratePer1kViewsLow, {
    message: "The high rate must be at least the low rate",
    path: ["assumptions"],
  });
export type RateInputForm = z.input<typeof rateInput>;

export const rateOutput = z.object({
  summary: z.string().min(1).max(800),
  explanation: z.array(z.string().max(500)).min(1).max(8),
  negotiationMessage: messageSchema,
  tips: z.array(z.string().max(300)).max(5),
});
export type RateOutput = z.infer<typeof rateOutput>;

/* ------------------------------------------------------------------ */

export const TOOL_SCHEMAS = {
  reply: { input: replyInput, output: replyOutput },
  negotiate: { input: negotiateInput, output: negotiateOutput },
  "risk-check": { input: riskInput, output: riskOutput },
  pitch: { input: pitchInput, output: pitchOutput },
  "rate-calculator": { input: rateInput, output: rateOutput },
} as const;

export type ToolOutput = {
  reply: ReplyOutput;
  negotiate: NegotiateOutput;
  "risk-check": RiskOutput;
  pitch: PitchOutput;
  "rate-calculator": RateOutput;
};

export function isToolId(v: string): v is ToolId {
  return (TOOL_IDS as readonly string[]).includes(v);
}

/** Flatten zod issues into { field: message } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
