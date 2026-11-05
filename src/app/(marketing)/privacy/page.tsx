import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "What DealBuddy AI stores, what is sent to our AI provider, and how to delete your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy notice</h1>
      <p className="mt-2 text-sm text-foreground-subtle">Plain-language summary of how DealBuddy AI handles your information.</p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-foreground-muted [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
        <section>
          <h2>What is sent to the AI provider</h2>
          <p>
            When you use a tool, the information you enter — for example a brand&apos;s email, a brief or contract excerpt, your follower count,
            niche, name and the options you choose — is sent from our server to Anthropic (the provider of the Claude AI model) to generate your
            result. Your request is not sent from your browser directly, and our API keys are never exposed to your device.
          </p>
          <p className="mt-2">
            Anthropic processes this data to provide the service under its commercial terms. Avoid pasting information you&apos;re not allowed to share,
            such as confidential contract terms you&apos;ve agreed not to disclose, or other people&apos;s personal details that aren&apos;t needed.
          </p>
        </section>

        <section>
          <h2>What we store</h2>
          <ul className="space-y-1.5">
            <li>Account details: your email, optional name, and when you signed up.</li>
            <li>Usage counts: how many AI generations you&apos;ve used in each billing period, so limits can be enforced.</li>
            <li>
              Tool history (if enabled): which tool you used, when, and a short label such as “Reply · negotiate · friendly”. We do not store the email,
              brief or contract text you paste.
            </li>
            <li>Saved results: only when you explicitly press Save (Creator Plus and Pro).</li>
            <li>Subscription status: plan, status, billing period and the Razorpay subscription ID. We never see or store your card or UPI details.</li>
          </ul>
        </section>

        <section>
          <h2>Your controls</h2>
          <ul className="space-y-1.5">
            <li>Turn tool history off at any time from your Account page.</li>
            <li>Delete individual saved results, or all results and history at once.</li>
            <li>Delete your account, which permanently removes your profile, saved results, history and usage records and cancels any active subscription.</li>
          </ul>
        </section>

        <section>
          <h2>Demo mode</h2>
          <p>
            Demo mode shows pre-written sample outputs. Demo requests are validated on our server but are not sent to the AI provider and are not stored.
          </p>
        </section>

        <section>
          <h2>Not legal or financial advice</h2>
          <p>
            DealBuddy provides informational suggestions. Rate figures are indicative estimates based on the information you provide and transparent
            assumptions — not verified or guaranteed market rates. The Risk Checker cannot determine whether an agreement is legally valid; consult a
            qualified professional for significant agreements.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>For privacy questions or data requests, contact the site operator at the support email listed on this site.</p>
        </section>
      </div>
    </article>
  );
}
