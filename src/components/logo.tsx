import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect width="32" height="32" rx="9" fill="#18181B" />
      <path d="M10 9.5h6.2c4.1 0 6.8 2.6 6.8 6.5s-2.7 6.5-6.8 6.5H10z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="22.6" cy="9.6" r="2.6" fill="#7C6CF6" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight text-foreground", className)}>
      <LogoMark />
      <span className="text-[15px]">
        DealBuddy <span className="text-accent">AI</span>
      </span>
    </Link>
  );
}
