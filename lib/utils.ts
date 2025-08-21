import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "./supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getUserId() {
  try {
    // Get the current session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!user) {
      return { data: null, error: "No authenticated user found." };
    }

    return { data: user.id, error: null };
  } catch (err) {
    //@ts-ignore
    return {
      data: null,//@ts-ignore
      error: `Unexpected error fetching user ID: ${err.message}`,
    };
  }
}

export async function getUserLocation() {
  try {
    // Fetch location data from GeoJS API
    const response = await fetch("https://get.geojs.io/v1/ip/geo.json");

    // Check if response is successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse JSON response
    const data = await response.json();

    // Extract relevant location information
    const location = {
      ip: data.ip,
      country: data.country,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      timezone: data.timezone,
      organization: data.organization,
    };

    return location;
  } catch (error) {
    console.error("Error fetching user location:", error);
    return null;
  }
}

export async function handleEmailConfirmationRedirect() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error.message);
    // Handle error, maybe redirect to an error page
    return;
  }

  if (session) {
    const userId = session.user.id;
    // Fetch user's role from your database (e.g., from a 'profiles' table)
    const { data: profile, error: profileError } = await supabase
      .from("profiles") // Assuming you have a profiles table with user roles
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError.message);
      // Handle error
      return;
    }

    if (profile && profile.role) {
      switch (profile.role) {
        case "admin":
          window.location.href = "/dashboard/admin";
          break;
        case "super_admin":
          window.location.href = "/dashboard/super_admin";
          break;
        case "volunteer":
          window.location.href = "/onboarding/volunteer";
          break;
        case "agency":
          window.location.href = "/onboarding/agency";
          break;
        default:
          window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/dashboard";
    }
  } else {
    window.location.href = "/login";
  }
}
// handleEmailConfirmationRedirect();
