/**
 * Demo content. Example inputs fill the forms; sample outputs are shown in demo
 * mode and are ALWAYS labelled as pre-written samples — never as live AI output.
 * All brands and people here are fictional.
 */
import { formatINR } from "./utils";
import type { RateEstimate } from "./rates";
import type {
  NegotiateInput,
  NegotiateOutput,
  PitchInput,
  PitchOutput,
  RateInputForm,
  RateOutput,
  ReplyInput,
  ReplyOutput,
  RiskInput,
  RiskOutput,
  ToolId,
} from "./tools/schemas";

export const EXAMPLE_INPUTS: {
  reply: ReplyInput;
  negotiate: NegotiateInput;
  "risk-check": RiskInput;
  pitch: PitchInput;
  "rate-calculator": RateInputForm;
} = {
  reply: {
    brandEmail: `Subject: Collaboration with Glowmint Skincare 🌿

Hi Ananya,

I'm Rohit from the influencer team at Glowmint Skincare. We love your skincare content and would like to collaborate for the launch of our new Vitamin C serum.

Deliverables: 1 reel + 2 stories
Budget: ₹5,000 + products worth ₹2,500
We would also like to use the reel on our page and ads for 3 months.

Please share your confirmation by Friday so we can ship the products.

Thanks,
Rohit
Glowmint Skincare`,
    creatorName: "Ananya",
    creatorNiche: "beauty",
    tone: "professional",
    goal: "negotiate",
  },
  negotiate: {
    proposedPayment: 8000,
    reels: 1,
    stories: 3,
    posts: 0,
    rawFootage: true,
    paidAds: true,
    usageDuration: "6m",
    exclusivity: "3m",
    followers: 42000,
    avgReelViews: 18000,
    niche: "fitness",
    minPayment: 15000,
    otherTerms: "Payment within 60 days of the post going live. Two rounds of revisions.",
  },
  "risk-check": {
    text: `Influencer Collaboration Terms — Brewhaus Coffee Co.

1. Deliverables: Creator will publish 2 Instagram reels and 4 stories featuring Brewhaus Cold Brew within the campaign window. Brand may request revisions until satisfied.
2. Fee: ₹20,000 total, payable 90 days after campaign completion, subject to the content achieving a minimum of 50,000 views per reel.
3. Rights: Creator grants Brewhaus perpetual, worldwide rights to use, edit and adapt the content across all media including paid advertising.
4. Exclusivity: Creator shall not promote any beverage brand for 6 months from the date of signing.
5. Brand may cancel this collaboration at any time without liability.
6. Content must remain live on the creator's profile permanently.`,
    proposedPayment: 20000,
    niche: "food",
  },
  pitch: {
    creatorName: "Kabir Mehta",
    instagramHandle: "@kabir.eats",
    niche: "food",
    followers: 26500,
    avgReelViews: 14000,
    engagementRate: 5.2,
    brandName: "Spicekraft",
    brandCategory: "Packaged spice blends",
    collabType: "sponsored_reel",
    tone: "friendly",
    aboutYou: "I make 30-second home-cooking reels for working professionals in Mumbai. Most of my audience is 22–34.",
  },
  "rate-calculator": {
    followers: 35000,
    avgReelViews: 15000,
    avgStoryViews: 3500,
    engagementRate: 4.5,
    niche: "lifestyle",
    reels: 2,
    stories: 3,
    posts: 0,
    rawFootage: false,
    paidAds: true,
    usageDuration: "3m",
    exclusivity: "none",
  },
};

const DEMO_REPLY: ReplyOutput = {
  subject: "Re: Collaboration with Glowmint Skincare",
  body: `Hi Rohit,

Thank you for reaching out — I'd be glad to work with Glowmint on the Vitamin C serum launch. It fits well with the skincare routines I share.

Before I confirm, a quick note on scope. The brief includes 1 reel, 2 stories and 3 months of use on your page and in ads. Paid ad usage is priced separately from content creation, so ₹5,000 + product doesn't cover the full scope.

For 1 reel + 2 stories with 3 months of organic and paid usage, my fee is [your quote]. If you'd like to stay closer to your current budget, I can do the reel and stories with organic reposting only, without paid ads.

Could you also share the payment timeline and whether there's any exclusivity? Happy to lock this in by Friday once we align.

Best,
Ananya`,
  placeholders: ["[your quote]"],
  tips: [
    "They've bundled 3 months of paid ad usage into a ₹5,000 offer — that's usually charged separately.",
    "Payment timeline isn't mentioned. Confirm it before the products ship.",
  ],
};

const DEMO_NEGOTIATE: NegotiateOutput = {
  verdict: "well_below",
  assessment:
    "₹8,000 is well below the indicative range for this scope. The fee would have to cover the content plus six months of paid ads, raw footage and three months of fitness-category exclusivity — the rights alone are typically priced above the content fee.",
  issues: [
    { title: "Paid ads bundled for 6 months", detail: "The brand can put money behind your reel for half a year without paying for that licence.", severity: "high" },
    { title: "Raw footage requested", detail: "Raw files let the brand re-edit your content into new ads. That deserves a separate fee.", severity: "medium" },
    { title: "3-month exclusivity", detail: "You may have to turn down other fitness brands for a quarter.", severity: "medium" },
    { title: "Payment 60 days after posting", detail: "A long payment cycle with no advance puts the cash-flow risk on you.", severity: "medium" },
  ],
  counterOffer: {
    low: 40000,
    high: 65000,
    anchor: 65000,
    rationale:
      "Indicative suggestion based on the information provided: ~18,000 average views priced as a fitness creator, with paid usage, raw footage and exclusivity added as separate rights fees.",
  },
  strategy: [
    "Open at ₹65,000 and show the split: content fee vs. paid usage, raw footage and exclusivity.",
    "If they can't move much, trade scope instead of price: drop raw footage and cut paid usage to 1–3 months.",
    "Ask for 50% advance and the balance within 15–30 days of posting.",
    "Define exclusivity narrowly (e.g. protein supplements only) rather than all fitness brands.",
    "Walk away below your ₹15,000 minimum unless the rights are removed.",
  ],
  message: {
    subject: null,
    body: `Hi [Brand contact name],

Thanks for the details — I'd love to make this work.

Since the brief includes 6 months of paid ad usage, raw footage and 3 months of category exclusivity, I've priced the content and the rights separately:

• 1 reel + 3 stories: ₹30,000
• Paid usage (6 months), raw footage and exclusivity: ₹35,000
Total: ₹65,000

If budget is tight, I can do the reel and stories with organic reposting only, no raw files and no exclusivity, for ₹24,000.

I'd also request 50% advance and the balance within 30 days of posting. Happy to jump on a quick call to align.

Best,
[Your name]`,
  },
  clarify: [
    "Exact exclusivity scope — which product categories and competitors?",
    "Whether paid usage includes whitelisting from your handle",
    "Number of revision rounds and what counts as a revision",
    "Payment schedule and invoice requirements (GST, TDS)",
  ],
  assumptions: [
    "Average reel views of 18,000 are typical for your recent reels.",
    "Rights fees are calculated as a percentage of the content fee.",
  ],
  missingInfo: ["Engagement rate", "The brand's total campaign budget"],
};

const DEMO_RISK: RiskOutput = {
  overall: "high",
  summary:
    "Several terms here are potentially unfavourable: payment depends on view targets and comes 90 days after the campaign, the brand gets perpetual paid-ads rights, and it can cancel without paying for completed work. Clarify and renegotiate these before agreeing.",
  areas: [
    { area: "deliverables", status: "green", finding: "2 reels and 4 stories are clearly listed.", whyItMatters: "Clear scope prevents extra unpaid content requests." },
    { area: "payment_terms", status: "red", finding: "₹20,000 is contingent on 50,000 views per reel.", whyItMatters: "You can't control reach — you could do the work and not get paid." },
    { area: "payment_deadlines", status: "red", finding: "Payable 90 days after campaign completion.", whyItMatters: "A long delay with no advance puts the cash-flow risk on you." },
    { area: "usage_rights", status: "red", finding: "Perpetual, worldwide rights to use, edit and adapt.", whyItMatters: "Your face and content could be used indefinitely, in contexts you haven't approved." },
    { area: "paid_ads", status: "red", finding: "Paid advertising is included with no separate fee.", whyItMatters: "Paid usage is usually priced separately because it extends reach far beyond your audience." },
    { area: "exclusivity", status: "yellow", finding: "No beverage brands for 6 months from signing.", whyItMatters: "This is broad; it could block tea, juice or energy-drink deals too." },
    { area: "usage_duration", status: "red", finding: "Perpetual.", whyItMatters: "There's no end date, so you can't relicense or renegotiate later." },
    { area: "ownership", status: "yellow", finding: "Ownership isn't stated, but 'edit and adapt' rights are broad.", whyItMatters: "Ambiguity about ownership can lead to disputes over reuse." },
    { area: "revisions", status: "red", finding: "Revisions 'until satisfied'.", whyItMatters: "Unlimited revisions can multiply your workload without extra pay." },
    { area: "cancellation", status: "red", finding: "Brand may cancel at any time without liability.", whyItMatters: "You could lose the fee after shooting or posting." },
    { area: "approval", status: "yellow", finding: "No approval process or timelines described.", whyItMatters: "Without timelines, approvals can delay posting and payment." },
    { area: "penalties", status: "yellow", finding: "Content must stay live permanently.", whyItMatters: "An ongoing obligation with no end date limits control of your own profile." },
  ],
  redFlags: [
    { title: "Payment tied to view targets", excerpt: "subject to the content achieving a minimum of 50,000 views per reel", whyItMatters: "Reach depends on the algorithm. You'd carry all the performance risk.", severity: "red" },
    { title: "Perpetual paid usage", excerpt: "perpetual, worldwide rights to use, edit and adapt the content across all media including paid advertising", whyItMatters: "Unlimited ad usage of your likeness for a one-time ₹20,000.", severity: "red" },
    { title: "Cancel without liability", excerpt: "Brand may cancel this collaboration at any time without liability.", whyItMatters: "There's no kill fee for work already done.", severity: "red" },
    { title: "Unlimited revisions", excerpt: "Brand may request revisions until satisfied.", whyItMatters: "There's no cap on the rework you could be asked to do.", severity: "red" },
  ],
  questions: [
    "Can payment be a fixed fee not linked to view counts?",
    "Can we agree 50% advance and the balance within 30 days of posting?",
    "What usage period and channels do you need? Can paid usage be quoted separately?",
    "Which specific categories does 'beverage brand' exclusivity cover?",
    "How many revision rounds are expected?",
  ],
  suggestedChanges: [
    { issue: "Performance-based payment", ask: "Fixed fee of ₹20,000, not contingent on views." },
    { issue: "Payment timing", ask: "50% advance, 50% within 30 days of posting." },
    { issue: "Perpetual rights", ask: "Organic usage for 3 months; paid usage only if licensed separately." },
    { issue: "Cancellation", ask: "Kill fee of 50% if cancelled after shooting, 100% after posting." },
    { issue: "Revisions", ask: "Up to 2 rounds of revisions on the script and 1 on the edit." },
  ],
  message: {
    subject: "Re: Brewhaus collaboration terms",
    body: `Hi [Brand contact name],

Thanks for sharing the terms — I'm excited about Brewhaus Cold Brew and would love to make this work. Before signing, I'd like to align on a few points:

1. Payment: a fixed ₹20,000 fee (not tied to view counts), with 50% advance and the balance within 30 days of posting.
2. Usage: 3 months of organic use. If you need paid ads, I'm happy to quote that separately.
3. Revisions: up to 2 rounds.
4. Cancellation: a 50% kill fee if cancelled after shooting.
5. Exclusivity: could we limit this to cold coffee brands for 3 months?

Let me know what works and I'll share a revised draft.

Best,
[Your name]`,
  },
  ambiguities: [
    "\"Campaign completion\" isn't defined, so the 90-day payment clock has no clear start date.",
    "\"Edit and adapt\" could allow significant changes to your content without your approval.",
  ],
  legalReviewRecommended: true,
};

const DEMO_PITCH: PitchOutput = {
  subject: "Reel idea for Spicekraft — 30-second weeknight dinners",
  opening: "Hi Spicekraft team, spice blends that save time on weeknights are exactly what my audience asks me about.",
  introduction:
    "I'm Kabir (@kabir.eats). I make 30-second home-cooking reels for working professionals — 26,500 followers, around 14,000 average views per reel and a 5.2% engagement rate.",
  brandRelevance:
    "My audience cooks after work and wants flavour without a long prep list, which is what packaged spice blends promise.",
  collaborationIdea:
    "A sponsored reel: \"One blend, one pan, 15 minutes\" — I cook a full weeknight dinner using a Spicekraft blend, with the blend as the hero shot and a clear call to try it. I can also add a story with a link for easy purchase.",
  callToAction: "Would you be open to a quick call this week, or could you share a brief?",
  closing: "Warm regards,\nKabir Mehta\n@kabir.eats",
  fullEmail: `Hi Spicekraft team,

Spice blends that save time on weeknights are exactly what my audience asks me about.

I'm Kabir (@kabir.eats). I make 30-second home-cooking reels for working professionals in Mumbai — 26,500 followers, around 14,000 average views per reel and a 5.2% engagement rate. Most of my audience is 22–34.

My audience cooks after work and wants flavour without a long prep list, which is exactly what Spicekraft blends offer.

Idea: a sponsored reel called "One blend, one pan, 15 minutes". I cook a full weeknight dinner with a Spicekraft blend, with the blend as the hero shot and a clear call to try it. I can add a story with a purchase link too.

My media kit is here: [your media kit link]. Would you be open to a quick call this week, or could you share a brief?

Warm regards,
Kabir Mehta
@kabir.eats`,
  dm: "Hi Spicekraft! I'm Kabir — I make 30-second weeknight cooking reels for working professionals (26.5K followers, ~14K views per reel). I have a reel idea built around one of your blends: 'one blend, one pan, 15 minutes'. Could I send you the details?",
  followUp: `Hi Spicekraft team,

Just following up on my note from last week. One more angle: I could make a 3-part story series showing three different dinners with the same blend — a simple way to show its versatility.

Happy to share a quick script if that helps. Thank you!

Kabir`,
  placeholders: ["[your media kit link]"],
};

export const DEMO_OUTPUTS: Record<Exclude<ToolId, "rate-calculator">, unknown> = {
  reply: DEMO_REPLY,
  negotiate: DEMO_NEGOTIATE,
  "risk-check": DEMO_RISK,
  pitch: DEMO_PITCH,
};

/**
 * Template-based (non-AI) quote explanation and message for the rate
 * calculator. Used in demo mode — always labelled as a template.
 */
export function templateRateOutput(e: RateEstimate, i: { paidAds: boolean; rawFootage: boolean; exclusivity: string }): RateOutput {
  const rights = e.lines.filter((l) => l.kind === "rights");
  const content = e.lines.filter((l) => l.kind === "content");
  const contentText = content.map((l) => l.label).join(" + ") || "the deliverables";
  const hasRights = rights.length > 0;
  const contentMid = Math.round((e.contentFee.low + e.contentFee.high) / 2 / 500) * 500;
  const rightsMid = Math.max(0, e.startingQuote - e.contentFee.high);

  const body = [
    "Hi [Brand contact name],",
    "",
    "Thanks for reaching out — happy to share my quote.",
    "",
    hasRights
      ? `• Content (${contentText}): ${formatINR(e.contentFee.high)}\n• ${rights.map((r) => r.label).join(", ")}: ${formatINR(rightsMid)}\nTotal: ${formatINR(e.startingQuote)}`
      : `For ${contentText}, my fee is ${formatINR(e.startingQuote)}.`,
    "",
    hasRights
      ? `If you only need the content without the additional rights, I can do it for ${formatINR(contentMid)}.`
      : "This includes concept, shooting, editing and posting.",
    "",
    "I usually work with 50% advance and the balance within 30 days of posting. Let me know if this works and I'll share next steps.",
    "",
    "Best,",
    "[Your name]",
  ].join("\n");

  return {
    summary: `Indicative range: ${formatINR(e.total.low)} – ${formatINR(e.total.high)}. Suggested starting quote ${formatINR(e.startingQuote)}, minimum ${formatINR(e.minimumQuote)}.`,
    explanation: [
      ...e.assumptionNotes,
      hasRights
        ? "Usage rights, paid ads, exclusivity and raw footage are charged separately from content creation, because they give the brand extra value beyond your post."
        : "No extra rights were requested, so the quote is for content creation only.",
      "These are indicative suggestions based on your inputs — not verified market rates.",
    ],
    negotiationMessage: { subject: null, body },
    tips: [
      "Quote your starting number first and let the brand respond.",
      ...(i.paidAds ? ["Keep paid usage time-bound (1–3 months) and priced separately."] : []),
      ...(i.rawFootage ? ["Raw footage is worth a separate fee — or offer edited files only."] : []),
      "Ask for an advance to reduce payment risk.",
    ].slice(0, 4),
  };
}
