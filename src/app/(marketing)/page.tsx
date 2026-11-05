import Link from "next/link";
import {
  ArrowRight,
  ClipboardPaste,
  Copy,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Wand2,
  XCircle,
  CircleAlert,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PricingCards } from "@/components/pricing-cards";
import { TOOLS } from "@/lib/tools/catalog";

const STEPS = [
  { icon: ClipboardPaste, title: "Paste or enter the deal", text: "Drop in the brand's email, brief or offer — or just your numbers." },
  { icon: Wand2, title: "Pick what you want", text: "Accept, negotiate, ask questions, check terms or work out a quote." },
  { icon: Copy, title: "Copy and send", text: "Get a clear, professional result you can edit and send in seconds." },
];

const USE_CASES = [
  {
    title: "“₹5,000 + product for a reel and 3 months of ads?”",
    text: "The Negotiation Assistant separates the content fee from paid usage and writes a counteroffer that doesn't sound pushy.",
    tool: "/tools/negotiate",
  },
  {
    title: "A contract that says “perpetual, worldwide rights”",
    text: "The Risk Checker flags it in red, explains why it matters, and drafts a polite message asking for a time limit.",
    tool: "/tools/risk-check",
  },
  {
    title: "A brand DM you don't know how to answer",
    text: "Reply Generator writes a confident, on-brand reply — ask for the brief, accept, or decline without burning the bridge.",
    tool: "/tools/reply",
  },
  {
    title: "You want to work with a brand you love",
    text: "Pitch Generator writes the email, a short DM and a follow-up — using only the facts you give it.",
    tool: "/tools/pitch",
  },
];

const FAQ = [
  {
    q: "Is DealBuddy free?",
    a: "Yes. Every account gets 3 free AI generations across all five tools, and the rate calculator's numbers are always free. You can also try every tool in demo mode without signing up.",
  },
  {
    q: "Are the rates real market rates?",
    a: "No — and we never pretend they are. DealBuddy gives indicative estimates from transparent assumptions (views, niche, deliverables, rights). You can see and edit every assumption and recalculate.",
  },
  {
    q: "Is the Risk Checker legal advice?",
    a: "No. It highlights terms that may be unfavourable and suggests questions to ask, but it can't tell you whether a contract is legally valid. For significant agreements, have a lawyer review it.",
  },
  {
    q: "Will the AI make things up about me?",
    a: "It's instructed never to invent follower counts, results, past brand deals or credentials. Where a fact is needed and you haven't given it, it leaves a highlighted placeholder for you to fill in.",
  },
  {
    q: "What happens to the emails and contracts I paste?",
    a: "They're sent to our AI provider (Anthropic) to generate your result and aren't stored by DealBuddy unless you choose to save a result. You can delete saved results and your account at any time.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. DealBuddy is designed mobile-first — paste from Instagram or Gmail, tap generate, and copy the result straight back.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pt-20 lg:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground-muted">
            <Sparkles className="size-3.5 text-accent" /> Built for Instagram creators in India
          </p>
          <h1 className="text-balance text-[2.35rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Stop Undervaluing Your Brand Collaborations.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-foreground-muted sm:text-lg">
            Your AI assistant for replying to brands, negotiating better deals and protecting your creator business.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Try DealBuddy Free <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-foreground-subtle">No card needed · Try the demo without signing up</p>
        </div>

        {/* Product preview */}
        <div className="mx-auto mt-14 max-w-5xl">
          <Card className="overflow-hidden shadow-lift">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="ml-3 text-xs text-foreground-subtle">Example · Brand Email Reply</span>
            </div>
            <div className="grid md:grid-cols-2">
              <div className="space-y-3 border-b border-border p-5 md:border-b-0 md:border-r sm:p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Brand&apos;s email</p>
                <div className="rounded-xl bg-muted/60 p-4 text-sm leading-relaxed text-foreground-muted">
                  Hi Ananya, we&apos;d love to collaborate on our new Vitamin C serum. Deliverables: 1 reel + 2 stories. Budget: ₹5,000 + products.
                  We&apos;d also like to use the reel in ads for 3 months…
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Negotiate payment", "Professional"].map((t) => (
                    <span key={t} className="rounded-lg border border-accent bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Risk check</p>
                  <p className="flex items-center gap-2 text-sm"><XCircle className="size-4 text-danger" /> Paid ads bundled into the fee</p>
                  <p className="flex items-center gap-2 text-sm"><CircleAlert className="size-4 text-warning" /> Payment timeline not mentioned</p>
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-success" /> Deliverables clearly listed</p>
                </div>
              </div>
              <div className="space-y-3 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">Your reply</p>
                  <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-1 text-xs font-medium text-accent">
                    <Copy className="size-3" /> Copy
                  </span>
                </div>
                <div className="space-y-3 text-sm leading-relaxed">
                  <p>Hi Rohit,</p>
                  <p>Thank you for reaching out — I&apos;d be glad to work with Glowmint on the serum launch.</p>
                  <p>
                    One note on scope: paid ad usage is priced separately from content creation, so ₹5,000 + product doesn&apos;t cover 3 months of
                    ads. For the full scope, my fee is <mark className="rounded bg-warning-soft px-1 text-warning">[your quote]</mark>.
                  </p>
                  <p className="text-foreground-subtle">Happy to lock this in by Friday once we align…</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-border bg-surface py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Five tools. Every step of a brand deal.</h2>
            <p className="mt-3 text-[17px] text-foreground-muted">From the first DM to the final quote — no agency, no awkward guesswork.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <Link key={t.id} href={t.href} className="group">
                  <Card className="h-full p-6 shadow-none transition-all group-hover:border-border-strong group-hover:shadow-soft">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-semibold tracking-tight">{t.cardTitle}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{t.description}</p>
                  </Card>
                </Link>
              );
            })}
            <Card className="flex h-full flex-col justify-between bg-foreground p-6 text-white shadow-none">
              <div>
                <ShieldAlert className="size-6 text-[#a99ff8]" />
                <h3 className="mt-4 font-semibold tracking-tight">Honest by design</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  No invented stats about you. No fake &ldquo;market rates&rdquo;. Every estimate shows its assumptions.
                </p>
              </div>
              <Link href="/dashboard" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white">
                Try it now <ArrowRight className="size-4" />
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-[var(--radius-card)] border border-border bg-surface p-6">
                <span className="absolute right-5 top-5 text-sm font-medium tabular-nums text-foreground-subtle">0{i + 1}</span>
                <s.icon className="size-6 text-accent" />
                <h3 className="mt-4 font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm text-foreground-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-y border-border bg-surface py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Made for the deals creators actually get</h2>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {USE_CASES.map((u) => (
              <Link key={u.title} href={u.tool} className="group rounded-[var(--radius-card)] border border-border p-6 transition-colors hover:border-border-strong">
                <MessageSquareText className="size-5 text-foreground-subtle" />
                <h3 className="mt-3 font-semibold tracking-tight">{u.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{u.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple pricing</h2>
            <p className="mt-3 text-[17px] text-foreground-muted">Start free. Upgrade when brand deals become a habit.</p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-border bg-surface py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions</h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span className="text-xl leading-none text-foreground-subtle transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-[1.5rem] bg-foreground px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Your next brand deal deserves a better reply.</h2>
            <p className="mx-auto mt-3 max-w-lg text-white/70">Try all five tools free. No card, no signup needed for the demo.</p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/dashboard">
                Try DealBuddy Free <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
