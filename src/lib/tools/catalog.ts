import { Calculator, Handshake, MailOpen, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ToolId } from "./schemas";

export interface ToolMeta {
  id: ToolId;
  href: string;
  name: string;
  cardTitle: string;
  short: string;
  description: string;
  cta: string;
  icon: LucideIcon;
}

export const TOOLS: ToolMeta[] = [
  {
    id: "reply",
    href: "/tools/reply",
    name: "Brand Email Reply",
    cardTitle: "Reply to a Brand",
    short: "Paste a brand's email, get a ready-to-send reply.",
    description: "Paste a brand's email or DM and get a professional reply you can send in seconds.",
    cta: "Write a reply",
    icon: MailOpen,
  },
  {
    id: "negotiate",
    href: "/tools/negotiate",
    name: "Deal Negotiation Assistant",
    cardTitle: "Negotiate a Deal",
    short: "Assess an offer and get a counteroffer with a message.",
    description: "Enter the brand's offer and terms. Get an assessment, a counteroffer range and a message to send.",
    cta: "Assess an offer",
    icon: Handshake,
  },
  {
    id: "risk-check",
    href: "/tools/risk-check",
    name: "Brand Deal Risk Checker",
    cardTitle: "Check a Brand Deal",
    short: "Spot risky terms in a brief or contract.",
    description: "Paste a brief, offer or agreement excerpt. We flag terms that need clarification or pushback.",
    cta: "Check terms",
    icon: ShieldCheck,
  },
  {
    id: "pitch",
    href: "/tools/pitch",
    name: "Brand Pitch Generator",
    cardTitle: "Create a Brand Pitch",
    short: "Write an email, DM and follow-up to pitch a brand.",
    description: "Pitch a brand you'd love to work with — email, Instagram DM and follow-up, using only your real details.",
    cta: "Write a pitch",
    icon: Send,
  },
  {
    id: "rate-calculator",
    href: "/tools/rate-calculator",
    name: "Creator Rate Calculator",
    cardTitle: "Calculate My Rate",
    short: "Estimate what to quote, with transparent assumptions.",
    description: "Estimate an indicative quote in ₹ for a set of deliverables. Every assumption is visible and editable.",
    cta: "Calculate rate",
    icon: Calculator,
  },
];

export const toolById = (id: string) => TOOLS.find((t) => t.id === id);
