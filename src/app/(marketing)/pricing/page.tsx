import type { Metadata } from "next";
import { PricingCards } from "@/components/pricing-cards";
import { FREE_LIMIT } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start free with 3 AI generations. Creator Plus ₹299/month, Creator Pro ₹599/month.",
  alternates: { canonical: "/pricing" },
};

const QA = [
  { q: "What counts as a generation?", a: "Each successful AI result — a reply, a refinement like “make it shorter”, a negotiation plan, a risk check, a pitch or a quote message. Failed attempts don't count." },
  { q: "Is the rate calculator included in the limit?", a: "Calculating your rate is always free and unlimited. Only the AI-written quote message uses a generation." },
  { q: `What happens after my ${FREE_LIMIT} free generations?`, a: "You can keep using the free rate calculator and demo samples, or upgrade for a monthly allowance." },
  { q: "Can I cancel?", a: "Yes. Cancel any time from your account page — your plan stays active until the end of the billing period." },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Pricing that works for creators</h1>
        <p className="mx-auto mt-3 max-w-xl text-[17px] text-foreground-muted">
          Start free with {FREE_LIMIT} AI generations. Upgrade when you&apos;re handling brand deals every week.
        </p>
      </div>
      <PricingCards />
      <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-2">
        {QA.map((x) => (
          <div key={x.q}>
            <p className="font-medium">{x.q}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{x.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
