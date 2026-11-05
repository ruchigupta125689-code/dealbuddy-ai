import type { Metadata } from "next";
import { RiskTool } from "@/components/tools/risk-tool";

export const metadata: Metadata = {
  title: "Brand Deal Risk Checker",
  description: "Paste a collaboration brief or contract and spot unfavourable usage rights, exclusivity, payment and cancellation terms.",
  alternates: { canonical: "/tools/risk-check" },
};

export default function Page() {
  return <RiskTool />;
}
