import { z } from "zod";
import { PLANS } from "@/lib/plans";
import { isSameOrigin, json, jsonError, readJson } from "@/lib/server/http";
import { clientIp } from "@/lib/server/rate-limit";
import { getEntitlement, resolveContext } from "@/lib/server/usage";
import { createUserClient, getSessionUser } from "@/lib/supabase/server";
import { TOOL_IDS, TOOL_SCHEMAS } from "@/lib/tools/schemas";

/** List the signed-in user's saved results. */
export async function GET() {
  const user = await getSessionUser();
  const supabase = await createUserClient();
  if (!user || !supabase) return jsonError(401, "unauthorized", "Sign in to see saved results.");
  const { data, error } = await supabase
    .from("generations")
    .select("id, tool, input_summary, output, saved_at, created_at")
    .not("output", "is", null)
    .order("saved_at", { ascending: false })
    .limit(100);
  if (error) return jsonError(500, "db_error", "Couldn't load saved results.");
  return json({ items: data });
}

const saveSchema = z.object({
  tool: z.enum(TOOL_IDS),
  generationId: z.string().uuid().nullable().optional(),
  label: z.string().trim().max(200).optional(),
  output: z.unknown(),
});

/** Save a result (Creator Plus / Pro). Only saved when the user explicitly asks. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Invalid origin.");
  const context = await resolveContext(clientIp(req));
  if (context.mode !== "live" || !context.user) return jsonError(401, "unauthorized", "Sign in to save results.");
  const ent = await getEntitlement(context);
  if (!ent || !PLANS[ent.plan].canSave) {
    return jsonError(402, "upgrade_required", "Saving results is available on Creator Plus and Pro.");
  }

  const body = saveSchema.safeParse(await readJson(req, 48 * 1024));
  if (!body.success) return jsonError(422, "invalid_input", "Invalid result.");
  const output = TOOL_SCHEMAS[body.data.tool].output.safeParse(body.data.output);
  if (!output.success) return jsonError(422, "invalid_output", "This result can't be saved.");

  const supabase = await createUserClient();
  if (!supabase) return jsonError(503, "unavailable", "Database unavailable.");
  const now = new Date().toISOString();

  if (body.data.generationId) {
    const { data, error } = await supabase
      .from("generations")
      .update({ output: output.data, saved_at: now })
      .eq("id", body.data.generationId)
      .select("id")
      .maybeSingle();
    if (!error && data) return json({ id: data.id });
  }
  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: context.user.id,
      tool: body.data.tool,
      input_summary: body.data.label ?? "Saved result",
      output: output.data,
      saved_at: now,
    })
    .select("id")
    .single();
  if (error) return jsonError(500, "db_error", "Couldn't save this result.");
  return json({ id: data.id });
}

/** Delete all of the user's generation records and saved results. */
export async function DELETE(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Invalid origin.");
  const user = await getSessionUser();
  const supabase = await createUserClient();
  if (!user || !supabase) return jsonError(401, "unauthorized", "Sign in first.");
  const { error } = await supabase.from("generations").delete().eq("user_id", user.id);
  if (error) return jsonError(500, "db_error", "Couldn't delete results.");
  return json({ ok: true });
}
