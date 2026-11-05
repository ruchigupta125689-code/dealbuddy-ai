# DealBuddy AI

**Your AI assistant for smarter brand collaborations.** A mobile-first web app for Instagram creators in India, with five tools:

| Tool | Route | What it does |
|---|---|---|
| Brand Email Reply | `/tools/reply` | Paste a brand email/DM and get a ready-to-send reply in 5 tones × 5 goals. Copy, regenerate, make it shorter/more professional/friendlier, edit. |
| Deal Negotiation Assistant | `/tools/negotiate` | Assesses an offer against a transparent indicative estimate. Returns issues, a counteroffer range, a strategy, a message, terms to clarify, assumptions and missing info. |
| Brand Deal Risk Checker | `/tools/risk-check` | Reviews a brief or contract across 12 areas with green/yellow/red status, red flags with quotes, questions, suggested changes and a message. Informational, not legal advice. |
| Brand Pitch Generator | `/tools/pitch` | Writes a pitch email, an Instagram DM and a follow-up using only the facts the creator provides. |
| Creator Rate Calculator | `/tools/rate-calculator` | Rule-based ₹ estimate (instant and free) with content fees kept separate from licensing, paid ads, exclusivity and raw footage. Every assumption can be edited. Optional AI quote message. |

Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, shadcn-style UI components, Lucide icons, Anthropic Claude API, Supabase (Postgres + Auth + RLS), Razorpay Subscriptions, Vercel.

---

## How the app behaves with and without credentials

| Configured | Behaviour |
|---|---|
| Nothing | **Demo mode.** Every page works. Tools validate input and return clearly labelled *pre-written samples*. The rate calculator's numbers are real calculations, and its message is a labelled template. |
| Anthropic only (`npm run dev`) | **Local preview.** Real Claude generations with no database, limited per IP in memory (`LOCAL_PREVIEW_LIMIT`, default 3). Only available outside production. |
| Anthropic only (deployed) | Demo mode, so a deployed site never runs unmetered AI calls. |
| Anthropic + Supabase | **Live.** Signed-out visitors get demo mode. Signed-in users get 3 free generations per account, tracked atomically in Postgres. |
| + Razorpay (all 5 vars) | Paid plans are purchasable. Until then the buttons read "Paid plans launching soon". |

Only *successful* generations count: if Claude fails, the reservation is released.

---

## Run locally

```bash
npm install
cp .env.example .env.local     # optionally fill in ANTHROPIC_API_KEY
npm run dev                    # http://localhost:3000
```

Requires Node 20+.

### Scripts

```bash
npm run dev         # development server
npm run build       # production build
npm run start       # serve the production build
npm run lint        # ESLint
npm run typecheck   # route types + TypeScript
npm test            # unit tests (rate engine, schemas, prompt-injection hardening, signatures, rate limiter)
npm run test:db     # SQL schema + RLS tests against a local Postgres (see tests/db)
```

End-to-end tests (`tests/e2e`) run the API and a headless browser against a mock Claude server:

```bash
npx tsx tests/e2e/mock-anthropic.ts &
ANTHROPIC_API_KEY=test ANTHROPIC_BASE_URL=http://127.0.0.1:4010 LOCAL_PREVIEW_LIMIT=9 \
  RATE_LIMIT_IP_PER_MIN=100 RATE_LIMIT_USER_PER_MIN=100 npx next dev -p 3100 &
BASE=http://localhost:3100 MODE=local node tests/e2e/api.test.mjs
BASE=http://localhost:3100 node tests/e2e/browser.test.mjs   # needs Chrome at /usr/bin/google-chrome
```

---

## Connect the Anthropic API

1. Create a key at <https://console.anthropic.com> → **API Keys**.
2. Set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` (any current model ID from the [models page](https://docs.claude.com/en/docs/about-claude/models); the default is `claude-sonnet-5-5`). Optionally set `ANTHROPIC_MODEL_PRO` for Creator Pro.
3. Restart the server. The dashboard switches from "Demo mode" to a generation counter.

All AI calls run server-side in `src/app/api/generate/[tool]/route.ts`. The key is read only in `src/lib/config.ts` (marked `server-only`), so it never reaches the browser.

**How generation works:** each tool has its own system prompt (`src/lib/ai/prompts.ts`). User content is wrapped in tags and sanitised as untrusted data (`src/lib/ai/user-message.ts`). Claude must answer through a forced tool call whose JSON schema is generated from Zod (`src/lib/tools/schemas.ts`). The output is validated; if it's invalid, Claude gets one chance to correct it, and then the request fails cleanly without using a generation.

---

## Enable Supabase (auth, usage limits, saved results)

1. Create a project at <https://supabase.com>.
2. **SQL Editor** → paste and run [`supabase/schema.sql`](supabase/schema.sql). It is safe to re-run. It creates `profiles`, `subscriptions`, `generations` and `usage`, the signup trigger, the atomic `reserve_generation`/`release_generation` functions (service role only) and RLS policies.
3. **Project Settings → API**: copy the Project URL → `NEXT_PUBLIC_SUPABASE_URL`, the `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only, never `NEXT_PUBLIC_`).
4. **Authentication → URL Configuration**: Site URL = your `NEXT_PUBLIC_APP_URL`. Add `https://YOUR-DOMAIN/auth/callback` (and `http://localhost:3000/auth/callback`) to Redirect URLs.
5. **Authentication → Providers → Email**: keep it enabled. "Confirm email" is recommended. For production, set up custom SMTP so confirmation and reset emails aren't rate-limited.

Auth flows: sign up, log in, log out (`POST /auth/signout`), forgot password → email link → `/reset-password`.

**Data stored:** a short non-sensitive label per generation (never the pasted email or contract). Full output is stored only when a paid user presses **Save**. Users can turn history off, delete results, or delete their account (cascades all rows and cancels any subscription) from `/account`.

---

## Enable Razorpay (paid plans)

Payments stay disabled until **all** of these are set: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_ID_PLUS`, `RAZORPAY_PLAN_ID_PRO` (plus Supabase).

1. In the Razorpay Dashboard (start in **Test mode**), go to **Subscriptions → Plans** and create two monthly plans: *Creator Plus* ₹299 and *Creator Pro* ₹599. Copy their `plan_…` IDs.
2. **Settings → API Keys** → generate keys → `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
3. **Settings → Webhooks** → add `https://YOUR-DOMAIN/api/billing/webhook`, choose a secret (→ `RAZORPAY_WEBHOOK_SECRET`) and select the `subscription.*` events (authenticated, activated, charged, pending, halted, cancelled, completed, paused, resumed, updated).
4. Test a subscription with Razorpay test cards or UPI, check that the plan activates on `/account`, then switch to live keys.

Flow: `/api/billing/subscribe` creates the subscription → Razorpay Checkout → `/api/billing/verify` checks the checkout signature (HMAC) and fetches the subscription server-to-server → the webhook (HMAC-verified on the raw body) keeps status and billing period in sync. Users can cancel at the end of the cycle from `/account`.

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel, **Add New → Project** → import the repo. The framework preset (Next.js) is detected automatically.
3. Add the environment variables from `.env.example`. Set `NEXT_PUBLIC_APP_URL` to your production URL (used for canonical URLs, sitemap, OG tags and auth redirects).
4. Deploy. Then update the Supabase redirect URLs and Razorpay webhook URL to the production domain.
5. Optional: add a custom domain in Vercel → Domains.

---

## Project map

```
src/app/(marketing)     Landing, pricing, privacy
src/app/(app)           Dashboard, five tools, account
src/app/(auth)          Login, signup, forgot/reset password
src/app/api             generate/[tool], usage, generations, account, billing/*
src/lib/ai              Claude client, system prompts, message builders
src/lib/tools           Zod input/output schemas, tool catalogue
src/lib/rates.ts        Transparent rate engine (client + server)
src/lib/server          Usage/quota, rate limiting, helpers
src/lib/billing         Razorpay API, signature verification, sync
src/proxy.ts            Supabase session refresh (Next 16 "proxy" = middleware)
supabase/schema.sql     Database schema + RLS
tests/                  unit, db, e2e
```

## Known limitations

- **Rate estimates are heuristics.** Defaults (₹600–1,200 per 1,000 average reel views, niche multipliers, rights percentages) are starting assumptions, not verified market data. Calibrate them in `src/lib/rates.ts` as you learn from real deals.
- **Burst rate limiting is in-memory** per serverless instance. The hard quota is enforced atomically in Postgres. For stricter global limits, add Upstash/Vercel KV.
- **Plan changes:** upgrading Plus → Pro creates a new subscription. Cancel the old one from Razorpay (no automatic proration).
- **Live Supabase and Razorpay paths** are covered by SQL/RLS tests and signature tests, but they need a real project and test-mode keys for a full end-to-end check before launch.
- English only at launch. The prompts are structured so Hinglish can be added later.
- The OG image is a generated placeholder. Replace it with a designed asset.
