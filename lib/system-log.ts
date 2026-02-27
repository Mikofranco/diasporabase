import type { SupabaseClient } from "@supabase/supabase-js";

export interface SystemLogPayload {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
}

/**
 * Append a row to system_logs. Call from client after admin/super_admin actions.
 * Only works for users with role admin or super_admin (RLS enforced).
 */
export async function logSystemEvent(
  supabase: SupabaseClient,
  payload: SystemLogPayload
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const actorId = user?.id ?? null;

    let actorEmail: string | null = null;
    let actorRole: string | null = null;
    if (actorId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, role")
        .eq("id", actorId)
        .single();
      actorEmail = profile?.email ?? null;
      actorRole = profile?.role ?? null;
    }

    await supabase.from("system_logs").insert({
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id ?? null,
      details: payload.details ?? null,
      meta: payload.meta ?? null,
      actor_id: actorId,
      actor_email: actorEmail,
      actor_role: actorRole,
    });
  } catch {
    // Non-blocking: do not throw so app flow is not broken
  }
}
