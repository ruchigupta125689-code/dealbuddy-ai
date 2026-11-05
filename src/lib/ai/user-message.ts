/**
 * Builds the user turn for each tool. All user/third-party content is wrapped
 * in tags and any attempt to open/close our own tags inside the content is
 * neutralised, so pasted emails can't break out of their data block.
 */
import { nicheLabel } from "../niches";
import { EXCLUSIVITY_OPTIONS, USAGE_DURATIONS, type RateEstimate } from "../rates";
import { COLLAB_TYPES, type ToolId } from "../tools/schemas";
import type { z } from "zod";
import type { negotiateInput, pitchInput, rateInput, replyInput, riskInput } from "../tools/schemas";

const TAGS = [
  "brand_email",
  "brief",
  "creator_details",
  "brand_details",
  "deal_terms",
  "other_terms",
  "previous_draft",
  "refine_instruction",
  "indicative_estimate",
  "calculated_estimate",
  "deliverables",
  "request",
  "rules",
  "system",
];
const TAG_RE = new RegExp(`<\\s*/?\\s*(${TAGS.join("|")})\\b[^>]*>`, "gi");

export function sanitizeUntrusted(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(TAG_RE, (m) => m.replace(/</g, "‹").replace(/>/g, "›"))
    .trim();
}

const wrap = (tag: string, body: string) => `<${tag}>\n${body}\n</${tag}>`;
const line = (k: string, v: unknown) => (v === undefined || v === null || v === "" ? null : `${k}: ${v}`);
const lines = (...xs: (string | null)[]) => xs.filter(Boolean).join("\n");
const inr = (n?: number) => (n === undefined ? undefined : `₹${n.toLocaleString("en-IN")}`);
const num = (n?: number) => (n === undefined ? undefined : n.toLocaleString("en-IN"));
const durationLabel = (v: string) => USAGE_DURATIONS.find((d) => d.value === v)?.label ?? v;
const exclLabel = (v: string) => EXCLUSIVITY_OPTIONS.find((d) => d.value === v)?.label ?? v;
const mode = (detailed?: boolean) => `Mode: ${detailed ? "detailed" : "standard"}`;

type Out<T extends z.ZodTypeAny> = z.output<T>;

export function buildReplyMessage(i: Out<typeof replyInput>): string {
  const parts = [
    wrap(
      "creator_details",
      lines(line("Creator name", i.creatorName ?? "not provided"), line("Niche", i.creatorNiche ? nicheLabel(i.creatorNiche) : "not provided")),
    ),
    wrap("request", lines(line("Tone", i.tone), line("Desired response", i.goal), mode(i.detailed))),
    wrap("brand_email", sanitizeUntrusted(i.brandEmail)),
  ];
  if (i.refine) {
    parts.push(
      wrap(
        "previous_draft",
        sanitizeUntrusted(`${i.refine.previous.subject ? `Subject: ${i.refine.previous.subject}\n\n` : ""}${i.refine.previous.body}`),
      ),
    );
    parts.push(wrap("refine_instruction", i.refine.action));
  }
  parts.push("Write the reply now and submit it with the submit_result tool.");
  return parts.join("\n\n");
}

function deliverablesBlock(i: {
  reels: number;
  stories: number;
  posts: number;
  rawFootage: boolean;
  paidAds: boolean;
  usageDuration: string;
  exclusivity: string;
}) {
  return lines(
    line("Instagram reels", i.reels),
    line("Instagram stories", i.stories),
    line("Static posts", i.posts),
    line("Raw footage requested", i.rawFootage ? "yes" : "no"),
    line("Paid advertising / whitelisting rights requested", i.paidAds ? "yes" : "no"),
    line("Usage duration", durationLabel(i.usageDuration)),
    line("Exclusivity", exclLabel(i.exclusivity)),
  );
}

export function estimateBlock(e: RateEstimate): string {
  return lines(
    ...e.lines.map((l) => `- ${l.label} [${l.kind}]: ${inr(l.low)} – ${inr(l.high)} (${l.note})`),
    line("Content fee", `${inr(e.contentFee.low)} – ${inr(e.contentFee.high)}`),
    line("Rights & licensing fee", `${inr(e.rightsFee.low)} – ${inr(e.rightsFee.high)}`),
    line("Indicative total", `${inr(e.total.low)} – ${inr(e.total.high)}`),
    line("Suggested starting quote", inr(e.startingQuote)),
    line("Suggested minimum acceptable quote", inr(e.minimumQuote)),
    line("Average reel views used", `${num(e.effectiveReelViews)}${e.viewsEstimated ? " (ESTIMATED from followers)" : ""}`),
    e.warnings.length ? `Warnings:\n${e.warnings.map((w) => `- ${w}`).join("\n")}` : null,
    e.missing.length ? `Missing inputs:\n${e.missing.map((w) => `- ${w}`).join("\n")}` : null,
    `Assumptions:\n${e.assumptionNotes.map((w) => `- ${w}`).join("\n")}`,
  );
}

export function buildNegotiateMessage(i: Out<typeof negotiateInput>, estimate: RateEstimate): string {
  return [
    wrap(
      "deal_terms",
      lines(
        line("Brand's proposed payment", i.proposedPayment === 0 ? "₹0 (barter / product only)" : inr(i.proposedPayment)),
        deliverablesBlock(i),
      ),
    ),
    wrap(
      "creator_details",
      lines(
        line("Followers", num(i.followers)),
        line("Average views per reel", i.avgReelViews ? num(i.avgReelViews) : "not provided"),
        line("Niche", nicheLabel(i.niche)),
        line("Creator's preferred minimum payment", i.minPayment ? inr(i.minPayment) : "not provided"),
      ),
    ),
    i.otherTerms ? wrap("other_terms", sanitizeUntrusted(i.otherTerms)) : null,
    wrap("indicative_estimate", estimateBlock(estimate)),
    wrap("request", mode(i.detailed)),
    "Analyse this offer and submit your result with the submit_result tool.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildRiskMessage(i: Out<typeof riskInput>): string {
  return [
    wrap(
      "creator_details",
      lines(
        line("Proposed payment", i.proposedPayment !== undefined ? inr(i.proposedPayment) : "not provided"),
        line("Niche", i.niche ? nicheLabel(i.niche) : "not provided"),
      ),
    ),
    wrap("request", mode(i.detailed)),
    wrap("brief", sanitizeUntrusted(i.text)),
    "Review the text inside <brief> and submit your result with the submit_result tool.",
  ].join("\n\n");
}

export function buildPitchMessage(i: Out<typeof pitchInput>): string {
  return [
    wrap(
      "creator_details",
      lines(
        line("Name", sanitizeUntrusted(i.creatorName)),
        line("Instagram handle", i.instagramHandle ? sanitizeUntrusted(i.instagramHandle) : "not provided"),
        line("Niche", nicheLabel(i.niche)),
        line("Followers", num(i.followers)),
        line("Average reel views", i.avgReelViews ? num(i.avgReelViews) : "not provided"),
        line("Engagement rate", i.engagementRate !== undefined ? `${i.engagementRate}%` : "not provided"),
        line("Other true details the creator provided", i.aboutYou ? sanitizeUntrusted(i.aboutYou) : "none"),
      ),
    ),
    wrap(
      "brand_details",
      lines(
        line("Brand name", sanitizeUntrusted(i.brandName)),
        line("Brand category", sanitizeUntrusted(i.brandCategory)),
        line("Collaboration type wanted", COLLAB_TYPES.find((c) => c.value === i.collabType)?.label),
      ),
    ),
    wrap("request", lines(line("Tone", i.tone), mode(i.detailed))),
    "Write the pitch and submit it with the submit_result tool.",
  ].join("\n\n");
}

export function buildRateMessage(i: Out<typeof rateInput>, estimate: RateEstimate): string {
  return [
    wrap(
      "creator_details",
      lines(
        line("Followers", num(i.followers)),
        line("Average reel views", i.avgReelViews ? num(i.avgReelViews) : "not provided"),
        line("Average story views", i.avgStoryViews ? num(i.avgStoryViews) : "not provided"),
        line("Engagement rate", i.engagementRate !== undefined ? `${i.engagementRate}%` : "not provided"),
        line("Niche", nicheLabel(i.niche)),
      ),
    ),
    wrap("deliverables", deliverablesBlock(i)),
    wrap("calculated_estimate", estimateBlock(estimate)),
    wrap("request", mode(i.detailed)),
    "Explain the estimate and write the quote message. Submit with the submit_result tool.",
  ].join("\n\n");
}

export type BuiltMessage = { tool: ToolId; text: string };
