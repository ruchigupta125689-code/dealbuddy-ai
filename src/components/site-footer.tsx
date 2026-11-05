import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-foreground-muted">Your AI assistant for smarter brand collaborations.</p>
          <p className="max-w-sm text-xs leading-relaxed text-foreground-subtle">
            DealBuddy gives informational suggestions, not legal or financial advice. Rate figures are indicative estimates, not
            verified market rates.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Tools</p>
          <Link className="block text-foreground-muted hover:text-foreground" href="/tools/reply">Reply to a brand</Link>
          <Link className="block text-foreground-muted hover:text-foreground" href="/tools/negotiate">Negotiate a deal</Link>
          <Link className="block text-foreground-muted hover:text-foreground" href="/tools/risk-check">Check a brand deal</Link>
          <Link className="block text-foreground-muted hover:text-foreground" href="/tools/pitch">Pitch a brand</Link>
          <Link className="block text-foreground-muted hover:text-foreground" href="/tools/rate-calculator">Rate calculator</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Product</p>
          <Link className="block text-foreground-muted hover:text-foreground" href="/pricing">Pricing</Link>
          <Link className="block text-foreground-muted hover:text-foreground" href="/privacy">Privacy</Link>
          <Link className="block text-foreground-muted hover:text-foreground" href="/#faq">FAQ</Link>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-foreground-subtle">
        © DealBuddy AI. Made for creators in India.
      </div>
    </footer>
  );
}
