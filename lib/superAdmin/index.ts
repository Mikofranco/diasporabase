"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminSupabase } from "../supabase/client";

export async function deleteUser(userId: string) {

  try {
    // 1. Delete from confirmation_link
    const { error: linkError } = await adminSupabase
      .from("confirmation_links")
      .delete()
      .eq("user_id", userId);

    if (linkError) throw linkError;

    // 2. Delete from profiles
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    // 3. Delete the auth user
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    revalidatePath("/dashboard/super-admin/user-management");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: (error as Error).message };
  }
}