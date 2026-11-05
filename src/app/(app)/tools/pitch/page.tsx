import type { Metadata } from "next";
import { PitchTool } from "@/components/tools/pitch-tool";

export const metadata: Metadata = {
  title: "Brand Pitch Generator for Creators",
  description: "Write a brand pitch email, Instagram DM and follow-up using only your real creator details.",
  alternates: { canonical: "/tools/pitch" },
};

export default function Page() {
  return <PitchTool />;
}
