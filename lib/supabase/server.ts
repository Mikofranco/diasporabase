import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants"
import type { cookies } from "next/headers"

export function createServerClientComponentClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {//@ts-ignore
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => cookieStore.set({ name, value, ...options }),
      remove: (name: string, options: CookieOptions) => cookieStore.set({ name, value: "", ...options }),
    },
  })
}

export function createServerActionClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {//@ts-ignore
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => cookieStore.set({ name, value, ...options }),
      remove: (name: string, options: CookieOptions) => cookieStore.set({ name, value: "", ...options }),
    },
  })
}
