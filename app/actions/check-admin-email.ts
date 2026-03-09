"use server";

import { getServerAdminClient } from "@/lib/supabase/admin";

/**
 * Server-only: check if an email already exists in profiles.
 * Used by super_admin create-admin flow. Do not expose to client.
 */
export async function checkEmailExists(email: string): Promise<{ exists: boolean }> {
  if (!email || typeof email !== "string" || email.length > 255) {
    return { exists: false };
  }
  const admin = getServerAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email.trim())
    .maybeSingle();
  if (error) {
    console.error("[checkEmailExists]", error);
    return { exists: false };
  }
  return { exists: !!data };
}
