/**
 * Server-side configuration. Never import this file from a client component:
 * it reads secrets. Public (browser-safe) values live in `public-config.ts`.
 */
import "server-only";

function clean(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t ? t : undefined;
}

export const config = {
  anthropic: {
    apiKey: clean(process.env.ANTHROPIC_API_KEY),
    // Configurable. Default is a current Claude model available on the Anthropic API.
    model: clean(process.env.ANTHROPIC_MODEL) ?? "claude-sonnet-5-5",
    // Optional: a model used for Creator Pro "priority" generations.
    proModel: clean(process.env.ANTHROPIC_MODEL_PRO),
    // Optional: only used for local testing against a mock server.
    baseURL: clean(process.env.ANTHROPIC_BASE_URL),
  },
  supabase: {
    url: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  },
  razorpay: {
    keyId: clean(process.env.RAZORPAY_KEY_ID),
    keySecret: clean(process.env.RAZORPAY_KEY_SECRET),
    webhookSecret: clean(process.env.RAZORPAY_WEBHOOK_SECRET),
    planIdPlus: clean(process.env.RAZORPAY_PLAN_ID_PLUS),
    planIdPro: clean(process.env.RAZORPAY_PLAN_ID_PRO),
  },
  appUrl: clean(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
};

export const isAIConfigured = () => Boolean(config.anthropic.apiKey);

export const isSupabaseConfigured = () =>
  Boolean(config.supabase.url && config.supabase.anonKey && config.supabase.serviceRoleKey);

/**
 * Live billing is only enabled when every piece is present: API keys,
 * webhook secret (so subscription state can be verified) and plan IDs.
 */
export const isPaymentsConfigured = () =>
  Boolean(
    isSupabaseConfigured() &&
      config.razorpay.keyId &&
      config.razorpay.keySecret &&
      config.razorpay.webhookSecret &&
      config.razorpay.planIdPlus &&
      config.razorpay.planIdPro,
  );

/**
 * Local preview mode: real Claude generations without Supabase, limited per IP
 * in memory. Only allowed outside production so a deployed site can never run
 * unmetered AI calls.
 */
export const isLocalPreviewAllowed = () => !config.isProduction && !isSupabaseConfigured() && isAIConfigured();
