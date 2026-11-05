import type { Metadata } from "next";
import { RateTool } from "@/components/tools/rate-tool";

export const metadata: Metadata = {
  title: "Instagram Creator Rate Calculator (India)",
  description: "Estimate what to charge brands in ₹ for reels, stories and posts — with transparent, editable assumptions.",
  alternates: { canonical: "/tools/rate-calculator" },
};

export default function Page() {
  return <RateTool />;
}
