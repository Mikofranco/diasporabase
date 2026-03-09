/**
 * Server-only Supabase admin client (service_role).
 * Only import this from Server Actions, API routes, or Server Components.
 * Never import from client components — the service role key must not be exposed.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function getServerAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin client. Do not use NEXT_PUBLIC_ prefix."
    );
  }
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
