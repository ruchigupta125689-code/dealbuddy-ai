import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { UsageProvider } from "@/components/usage-provider";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const title = "DealBuddy AI – AI Brand Deal Assistant for Influencers";
const description =
  "Reply to brand emails, negotiate influencer deals, check collaboration terms and calculate your creator rates with AI.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: title, template: "%s · DealBuddy AI" },
  description,
  applicationName: "DealBuddy AI",
  keywords: [
    "influencer rate calculator India",
    "brand collaboration email reply",
    "influencer negotiation",
    "creator brand deal",
    "UGC creator pricing",
    "Instagram influencer India",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DealBuddy AI",
    title,
    description,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fafaf7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <UsageProvider>{children}</UsageProvider>
        <Toaster position="bottom-center" toastOptions={{ className: "!rounded-xl !text-sm" }} />
      </body>
    </html>
  );
}
