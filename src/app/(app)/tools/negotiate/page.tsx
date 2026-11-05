import type { Metadata } from "next";
import { NegotiateTool } from "@/components/tools/negotiate-tool";

export const metadata: Metadata = {
  title: "Influencer Deal Negotiation Assistant",
  description: "Assess a brand's offer, get an indicative counteroffer range in ₹ and a ready-to-send negotiation message.",
  alternates: { canonical: "/tools/negotiate" },
};

export default function Page() {
  return <NegotiateTool />;
}
