import { supabase } from "@/lib/supabase/client";

export async function getUserProfileDetails(
  userId: string,
  profileType: "volunteer" | "agency"
) {
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .eq("role", profileType)
    .single();
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user profile details:", error);
    return { data: null, error };
  }

  return { data, error: null };
}
