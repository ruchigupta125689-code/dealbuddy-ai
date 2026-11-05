import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase/server";

/** Only allow relative, same-site redirects. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

/**
 * Handles links from Supabase emails (signup confirmation, password reset).
 * Supports both the PKCE `code` flow and the `token_hash` flow.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const supabase = await createUserClient();
  if (!supabase) return NextResponse.redirect(new URL("/login?error=auth_not_configured", url.origin));

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing_code") };

  if (error) return NextResponse.redirect(new URL("/login?error=link_invalid", url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
