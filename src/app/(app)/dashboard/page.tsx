import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your DealBuddy tools for replying to brands, negotiating deals, checking terms, pitching and pricing.",
  alternates: { canonical: "/dashboard" },
};

export default function Page() {
  return <Dashboard />;
}
