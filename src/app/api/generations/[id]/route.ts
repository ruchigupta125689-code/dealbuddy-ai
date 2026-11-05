import { isSameOrigin, json, jsonError } from "@/lib/server/http";
import { createUserClient, getSessionUser } from "@/lib/supabase/server";

export async function DELETE(req: Request, ctx: RouteContext<"/api/generations/[id]">) {
  if (!isSameOrigin(req)) return jsonError(403, "forbidden", "Invalid origin.");
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return jsonError(400, "bad_id", "Invalid id.");
  const user = await getSessionUser();
  const supabase = await createUserClient();
  if (!user || !supabase) return jsonError(401, "unauthorized", "Sign in first.");
  // RLS guarantees users can only delete their own rows.
  const { error } = await supabase.from("generations").delete().eq("id", id);
  if (error) return jsonError(500, "db_error", "Couldn't delete this result.");
  return json({ ok: true });
}
