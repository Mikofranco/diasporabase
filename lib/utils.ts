import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export async function getUserId() {
  try {
    // Get the current session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!user) {
      return { data: null, error: 'No authenticated user found.' };
    }

    return { data: user.id, error: null };
  } catch (err) {//@ts-ignore
    return { data: null, error: `Unexpected error fetching user ID: ${err.message}` };
  }
}
