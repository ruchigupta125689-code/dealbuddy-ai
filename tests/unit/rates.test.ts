import { describe, expect, it } from "vitest";
import { defaultAssumptions, estimateRate, roundQuote, type RateInput } from "@/lib/rates";

const base: RateInput = {
  followers: 35000,
  avgReelViews: 15000,
  niche: "lifestyle",
  reels: 1,
  stories: 0,
  posts: 0,
  rawFootage: false,
  paidAds: false,
  usageDuration: "none",
  exclusivity: "none",
};

describe("rate engine", () => {
  it("prices one reel from views × rate per 1k", () => {
    const e = estimateRate(base);
    // 15k views × ₹600–1200 per 1k × 1.0 niche × 1.0 engagement
    expect(e.perReel).toEqual({ low: 9000, high: 18000 });
    expect(e.total).toEqual({ low: 9000, high: 18000 });
    expect(e.rightsFee).toEqual({ low: 0, high: 0 });
    expect(e.startingQuote).toBe(18000);
    expect(e.minimumQuote).toBe(9000);
  });

  it("keeps rights separate from content and adds them on top", () => {
    const e = estimateRate({ ...base, paidAds: true, usageDuration: "3m", rawFootage: true, exclusivity: "3m" });
    expect(e.contentFee).toEqual({ low: 9000, high: 18000 });
    const kinds = e.lines.map((l) => l.kind);
    expect(kinds.filter((k) => k === "rights")).toHaveLength(3);
    // raw 20% + paid 3m 40% + exclusivity 3m 20% = 80% of content
    expect(e.rightsFee).toEqual({ low: 7000, high: 14500 });
    expect(e.total.high).toBe(roundQuote(18000 * 1.8));
  });

  it("estimates views when missing and reports it", () => {
    const e = estimateRate({ ...base, avgReelViews: undefined });
    expect(e.viewsEstimated).toBe(true);
    expect(e.effectiveReelViews).toBe(Math.round(35000 * 0.25));
    expect(e.missing.join(" ")).toMatch(/reel views/i);
  });

  it("warns on unspecified usage and perpetual usage", () => {
    expect(estimateRate({ ...base, usageDuration: "unspecified" }).warnings.join(" ")).toMatch(/not specified/);
    expect(estimateRate({ ...base, usageDuration: "perpetual" }).warnings.join(" ")).toMatch(/forever/);
  });

  it("assumes 1 month of paid usage if paid ads requested without a period", () => {
    const e = estimateRate({ ...base, paidAds: true, usageDuration: "none" });
    expect(e.lines.some((l) => /Paid ads/.test(l.label) && /1 month/.test(l.label))).toBe(true);
  });

  it("applies the minimum reel fee for tiny accounts", () => {
    const e = estimateRate({ ...base, followers: 800, avgReelViews: 200 });
    expect(e.perReel.low).toBe(2500);
    expect(e.warnings.join(" ")).toMatch(/product/);
  });

  it("respects edited assumptions (recalculate)", () => {
    const a = { ...defaultAssumptions("lifestyle"), ratePer1kViewsLow: 1000, ratePer1kViewsHigh: 2000 };
    expect(estimateRate(base, a).total).toEqual({ low: 15000, high: 30000 });
  });

  it("applies niche and engagement multipliers", () => {
    const fin = estimateRate({ ...base, niche: "finance" });
    expect(fin.perReel.low).toBe(roundQuote(15 * 600 * 1.4));
    const hi = estimateRate({ ...base, engagementRate: 8 });
    expect(hi.engagementMultiplier).toBe(1.1);
  });

  it("rounds quotes sensibly", () => {
    expect(roundQuote(4321)).toBe(4300);
    expect(roundQuote(12345)).toBe(12500);
    expect(roundQuote(0)).toBe(0);
  });
});
