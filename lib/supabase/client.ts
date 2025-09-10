import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ROLE_KEY } from "./constants";

let client: ReturnType<typeof createBrowserClient> | undefined;
let adminClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}

export function createAdminClient() {
  if (!adminClient) {//@ts-ignore
    adminClient = createBrowserClient(SUPABASE_URL, SUPABASE_ROLE_KEY);
  }
  return adminClient;
}

export const supabase = createClient();
export const adminSupabase = createAdminClient();