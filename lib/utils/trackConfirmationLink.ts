// utils/trackConfirmationLink.ts
import { createClient } from "@/lib/supabase/client";
import { ConfirmationLink } from "../types";

const supabase = createClient();

export async function trackConfirmationLink(
  userId: string,
  email: string,
  confirmationUrl: string,
  isResent = false
): Promise<ConfirmationLink | null> {
  const url = new URL(confirmationUrl);
  const tokenHash = url.searchParams.get("token") || null;

  const { data, error } = await supabase
    .from("confirmation_links")
    .insert({
      user_id: userId,
      email,
      confirmation_url: confirmationUrl,
      token_hash: tokenHash,
      is_resent: isResent,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to track confirmation link:", error);
    return null;
  }

  return data;
}