"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../supabase/constants";
import { routes } from "../routes";

function getAdminClient() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function deleteUser(userId: string) {
  try {
    const admin = getAdminClient();

    // 1. Delete from confirmation_links (best-effort; may not exist or have no row)
    await admin.from("confirmation_links").delete().eq("user_id", userId);

    // 2. Delete from profiles
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    // 3. Delete the auth user
    const { error: authError } = await admin.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    revalidatePath(routes.superAdminUsers);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: (error as Error).message };
  }
}