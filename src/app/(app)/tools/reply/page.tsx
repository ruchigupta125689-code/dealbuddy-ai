import type { Metadata } from "next";
import { ReplyTool } from "@/components/tools/reply-tool";

export const metadata: Metadata = {
  title: "Brand Email Reply Generator",
  description: "Paste a brand collaboration email and get a professional, ready-to-send reply in seconds.",
  alternates: { canonical: "/tools/reply" },
};

export default function Page() {
  return <ReplyTool />;
}
