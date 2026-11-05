import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/server/http";

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  if (!isSameOrigin(req)) return NextResponse.redirect(new URL("/", origin), 303);
  const supabase = await createUserClient();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL("/", origin), 303);
}
