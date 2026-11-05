import { AppHeader } from "@/components/site-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-foreground-subtle">
        Informational suggestions only — not legal or financial advice. Rates are indicative estimates.{" "}
        <a href="/privacy" className="underline-offset-2 hover:underline">
          Privacy
        </a>
      </footer>
    </>
  );
}
