/**
 * Transparent, rule-based rate estimator.
 *
 * These numbers are INDICATIVE. They are not verified market rates. Every
 * assumption below is shown to the creator and can be edited and recalculated.
 * The same engine runs in the browser (instant recalculation, no AI cost) and on
 * the server (to give Claude consistent numbers for negotiation advice).
 */
import type { Niche } from "./niches";

export const USAGE_DURATIONS = [
  { value: "none", label: "No usage by brand" },
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "perpetual", label: "Perpetual / forever" },
  { value: "unspecified", label: "Not specified" },
] as const;
export type UsageDuration = (typeof USAGE_DURATIONS)[number]["value"];
export const USAGE_DURATION_VALUES = USAGE_DURATIONS.map((d) => d.value) as [UsageDuration, ...UsageDuration[]];

export const EXCLUSIVITY_OPTIONS = [
  { value: "none", label: "No exclusivity" },
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "unspecified", label: "Not specified" },
] as const;
export type Exclusivity = (typeof EXCLUSIVITY_OPTIONS)[number]["value"];
export const EXCLUSIVITY_VALUES = EXCLUSIVITY_OPTIONS.map((d) => d.value) as [Exclusivity, ...Exclusivity[]];

export interface RateAssumptions {
  /** ₹ earned per 1,000 average reel views — low end of the range. */
  ratePer1kViewsLow: number;
  /** ₹ earned per 1,000 average reel views — high end of the range. */
  ratePer1kViewsHigh: number;
  /** Used only when average reel views are missing: views ≈ followers × this. */
  fallbackViewRatio: number;
  /** Floor for one reel, so very small accounts still cover production effort. */
  minReelFee: number;
  /** Story price as % of one reel (used when story views are unknown). */
  storyPctOfReel: number;
  /** Static post price as % of one reel. */
  postPctOfReel: number;
  /** Niche multiplier applied to content fees. */
  nicheMultiplier: number;
  /** Raw footage surcharge as % of the content fee. */
  rawFootagePct: number;
  /** Organic usage licence (brand reposts on its own channels) as % of content fee. */
  organicUsagePct: Record<Exclude<UsageDuration, "unspecified">, number>;
  /** Paid advertising / whitelisting licence as % of content fee. */
  paidUsagePct: Record<Exclude<UsageDuration, "unspecified">, number>;
  /** Exclusivity fee as % of content fee. */
  exclusivityPct: Record<Exclude<Exclusivity, "unspecified">, number>;
}

export const NICHE_MULTIPLIERS: Record<Niche, number> = {
  finance: 1.4,
  tech: 1.25,
  education: 1.2,
  beauty: 1.15,
  fashion: 1.1,
  fitness: 1.1,
  parenting: 1.1,
  travel: 1.05,
  food: 1.0,
  lifestyle: 1.0,
  gaming: 0.95,
  comedy: 0.95,
  other: 1.0,
};

export function defaultAssumptions(niche: Niche = "other"): RateAssumptions {
  return {
    ratePer1kViewsLow: 600,
    ratePer1kViewsHigh: 1200,
    fallbackViewRatio: 0.25,
    minReelFee: 2500,
    storyPctOfReel: 25,
    postPctOfReel: 50,
    nicheMultiplier: NICHE_MULTIPLIERS[niche] ?? 1,
    rawFootagePct: 20,
    organicUsagePct: { none: 0, "1m": 0, "3m": 10, "6m": 20, "12m": 30, perpetual: 50 },
    paidUsagePct: { none: 0, "1m": 25, "3m": 40, "6m": 50, "12m": 75, perpetual: 120 },
    exclusivityPct: { none: 0, "1m": 10, "3m": 20, "6m": 35, "12m": 60 },
  };
}

export interface RateInput {
  followers: number;
  avgReelViews?: number;
  avgStoryViews?: number;
  engagementRate?: number;
  niche: Niche;
  reels: number;
  stories: number;
  posts: number;
  rawFootage: boolean;
  paidAds: boolean;
  usageDuration: UsageDuration;
  exclusivity: Exclusivity;
}

export interface RateLine {
  label: string;
  kind: "content" | "rights";
  low: number;
  high: number;
  note: string;
}

export interface RateEstimate {
  lines: RateLine[];
  contentFee: { low: number; high: number };
  rightsFee: { low: number; high: number };
  total: { low: number; high: number };
  startingQuote: number;
  minimumQuote: number;
  perReel: { low: number; high: number };
  effectiveReelViews: number;
  viewsEstimated: boolean;
  engagementMultiplier: number;
  warnings: string[];
  missing: string[];
  assumptionNotes: string[];
}

export function engagementMultiplier(er?: number): number {
  if (er === undefined || !Number.isFinite(er)) return 1;
  if (er < 1) return 0.85;
  if (er < 3) return 0.95;
  if (er < 6) return 1;
  if (er < 10) return 1.1;
  return 1.15;
}

/** Round to a "quotable" number: nearest ₹100 under ₹5k, else nearest ₹500. */
export function roundQuote(n: number): number {
  if (n <= 0) return 0;
  const step = n < 5000 ? 100 : 500;
  return Math.round(n / step) * step;
}

const durationLabel = (d: string) => USAGE_DURATIONS.find((x) => x.value === d)?.label ?? d;
const exclusivityLabel = (d: string) => EXCLUSIVITY_OPTIONS.find((x) => x.value === d)?.label ?? d;

export function estimateRate(input: RateInput, a: RateAssumptions = defaultAssumptions(input.niche)): RateEstimate {
  const warnings: string[] = [];
  const missing: string[] = [];
  const notes: string[] = [];

  const followers = Math.max(0, input.followers || 0);
  let views = input.avgReelViews && input.avgReelViews > 0 ? input.avgReelViews : 0;
  const viewsEstimated = views === 0;
  if (viewsEstimated) {
    views = Math.round(followers * a.fallbackViewRatio);
    missing.push("Average reel views (estimated from follower count — this is the biggest driver of price)");
    notes.push(
      `Average reel views were not provided, so they were estimated as ${Math.round(a.fallbackViewRatio * 100)}% of followers (${views.toLocaleString("en-IN")} views).`,
    );
  }
  if (input.engagementRate === undefined) missing.push("Engagement rate (optional — would refine the estimate)");

  const em = engagementMultiplier(input.engagementRate);
  const nm = a.nicheMultiplier;

  const reelLow = Math.max(a.minReelFee, (views / 1000) * a.ratePer1kViewsLow * nm * em);
  const reelHigh = Math.max(a.minReelFee * 1.3, (views / 1000) * a.ratePer1kViewsHigh * nm * em);

  notes.push(
    `One reel is priced at ₹${a.ratePer1kViewsLow.toLocaleString("en-IN")}–₹${a.ratePer1kViewsHigh.toLocaleString("en-IN")} per 1,000 average views, with a floor of ₹${a.minReelFee.toLocaleString("en-IN")}.`,
  );
  notes.push(`Niche multiplier: ×${nm.toFixed(2)}. Engagement multiplier: ×${em.toFixed(2)}.`);

  const lines: RateLine[] = [];

  if (input.reels > 0) {
    lines.push({
      label: `${input.reels} × Instagram reel`,
      kind: "content",
      low: reelLow * input.reels,
      high: reelHigh * input.reels,
      note: "Concept, shooting, editing and posting.",
    });
  }

  if (input.stories > 0) {
    let sLow: number;
    let sHigh: number;
    if (input.avgStoryViews && input.avgStoryViews > 0) {
      sLow = Math.max(500, (input.avgStoryViews / 1000) * a.ratePer1kViewsLow * 0.6 * nm);
      sHigh = Math.max(700, (input.avgStoryViews / 1000) * a.ratePer1kViewsHigh * 0.6 * nm);
      notes.push("Stories are priced from your average story views at 60% of the reel per-view rate.");
    } else {
      sLow = Math.max(500, reelLow * (a.storyPctOfReel / 100));
      sHigh = Math.max(700, reelHigh * (a.storyPctOfReel / 100));
      notes.push(`Stories are priced at ${a.storyPctOfReel}% of one reel (story views not provided).`);
    }
    lines.push({
      label: `${input.stories} × Instagram story`,
      kind: "content",
      low: sLow * input.stories,
      high: sHigh * input.stories,
      note: "Story frames with link/tag.",
    });
  }

  if (input.posts > 0) {
    lines.push({
      label: `${input.posts} × static post`,
      kind: "content",
      low: Math.max(1500, reelLow * (a.postPctOfReel / 100)) * input.posts,
      high: Math.max(2000, reelHigh * (a.postPctOfReel / 100)) * input.posts,
      note: `Priced at ${a.postPctOfReel}% of one reel.`,
    });
  }

  const contentLow = lines.reduce((s, l) => s + l.low, 0);
  const contentHigh = lines.reduce((s, l) => s + l.high, 0);

  if (input.reels + input.stories + input.posts === 0) {
    missing.push("At least one deliverable (reels, stories or posts)");
  }

  if (input.rawFootage) {
    lines.push({
      label: "Raw footage handover",
      kind: "rights",
      low: contentLow * (a.rawFootagePct / 100),
      high: contentHigh * (a.rawFootagePct / 100),
      note: `+${a.rawFootagePct}% of content fee. Raw files let the brand re-edit and reuse your work.`,
    });
  }

  let duration = input.usageDuration;
  if (duration === "unspecified") {
    duration = "3m";
    warnings.push("Usage duration is not specified. The estimate assumes 3 months — ask the brand to confirm in writing.");
  }
  if (input.paidAds && duration === "none") {
    duration = "1m";
    warnings.push("Paid ads were requested without a usage period. The estimate assumes 1 month of paid usage.");
  }

  if (input.paidAds) {
    const pct = a.paidUsagePct[duration];
    if (pct > 0) {
      lines.push({
        label: `Paid ads / whitelisting (${durationLabel(duration)})`,
        kind: "rights",
        low: contentLow * (pct / 100),
        high: contentHigh * (pct / 100),
        note: `+${pct}% of content fee. Brand spends money to push your content to new audiences.`,
      });
    }
  } else {
    const pct = a.organicUsagePct[duration];
    if (pct > 0) {
      lines.push({
        label: `Brand usage rights (${durationLabel(duration)})`,
        kind: "rights",
        low: contentLow * (pct / 100),
        high: contentHigh * (pct / 100),
        note: `+${pct}% of content fee for the brand reposting on its own channels.`,
      });
    }
  }
  if (duration === "perpetual") {
    warnings.push("Perpetual usage means the brand can use your face and content forever. Consider capping it at 6–12 months.");
  }

  let excl = input.exclusivity;
  if (excl === "unspecified") {
    excl = "none";
    warnings.push("Exclusivity is not specified. Confirm whether you can work with competing brands.");
  }
  const exPct = a.exclusivityPct[excl];
  if (exPct > 0) {
    lines.push({
      label: `Category exclusivity (${exclusivityLabel(excl)})`,
      kind: "rights",
      low: contentLow * (exPct / 100),
      high: contentHigh * (exPct / 100),
      note: `+${exPct}% of content fee to compensate for turning down competing brands.`,
    });
  }

  const rightsLow = lines.filter((l) => l.kind === "rights").reduce((s, l) => s + l.low, 0);
  const rightsHigh = lines.filter((l) => l.kind === "rights").reduce((s, l) => s + l.high, 0);

  const totalLow = contentLow + rightsLow;
  const totalHigh = contentHigh + rightsHigh;

  if (followers < 1000) warnings.push("Very small accounts are often paid in product. Treat these numbers as a rough guide.");

  const round = (l: RateLine): RateLine => ({ ...l, low: roundQuote(l.low), high: roundQuote(l.high) });

  return {
    lines: lines.map(round),
    contentFee: { low: roundQuote(contentLow), high: roundQuote(contentHigh) },
    rightsFee: { low: roundQuote(rightsLow), high: roundQuote(rightsHigh) },
    total: { low: roundQuote(totalLow), high: roundQuote(totalHigh) },
    startingQuote: roundQuote(totalHigh),
    minimumQuote: roundQuote(totalLow),
    perReel: { low: roundQuote(reelLow), high: roundQuote(reelHigh) },
    effectiveReelViews: views,
    viewsEstimated,
    engagementMultiplier: em,
    warnings,
    missing,
    assumptionNotes: notes,
  };
}
