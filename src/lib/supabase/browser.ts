"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isAuthConfiguredClient = Boolean(url && anon);

let client: SupabaseClient | null = null;
export function getBrowserSupabase(): SupabaseClient | null {
  if (!url || !anon) return null;
  if (!client) client = createBrowserClient(url, anon);
  return client;
}
