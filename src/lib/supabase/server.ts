import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { config, isSupabaseConfigured } from "../config";

/** Request-scoped client that acts as the signed-in user (RLS applies). */
export async function createUserClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(config.supabase.url!, config.supabase.anonKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a context where cookies are read-only; the proxy refreshes sessions.
        }
      },
    },
  });
}

let admin: SupabaseClient | null = null;
/** Service-role client. Server only. Bypasses RLS — use only for quota/billing writes. */
export function createAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!admin) {
    admin = createClient(config.supabase.url!, config.supabase.serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export interface SessionUser {
  id: string;
  email: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createUserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
