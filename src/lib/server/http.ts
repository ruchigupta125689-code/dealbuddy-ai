import "server-only";
import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function jsonError(status: number, error: string, message: string, extra: Record<string, unknown> = {}) {
  return json({ error, message, ...extra }, status);
}

/** Rejects cross-site state-changing requests (basic CSRF protection). */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers / server-to-server
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<unknown | undefined> {
  const raw = await req.text();
  if (raw.length > maxBytes) return undefined;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return undefined;
  }
}
