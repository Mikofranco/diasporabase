// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants";
import type { cookies } from "next/headers";

export function createServerClientComponentClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        // Read all cookies at once — safe in Server Components
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          // Batch set — only works in Server Actions/Handlers
          cookiesToSet.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options)
          );
        } catch (error) {
          console.error("Failed to set Supabase cookies:", error);
          // Ignore in Server Components — Supabase will retry on next request
        }
      },
    },
  });
}

export function createServerActionClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options)
          );
        } catch (error) {
          console.error("Failed to set Supabase cookies in action:", error);
          throw error; // Re-throw in Server Actions for proper error handling
        }
      },
    },
  });
}