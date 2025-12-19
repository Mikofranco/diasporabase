import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "./supabase/client";
import { toast } from "sonner";
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from "./database/types";
import { Country, State, City } from 'country-state-city';
import { africanLocations } from "@/data/african-locations";

export type LocationData = {
  country?: string | null;  // e.g., "NG" (ISO code) or full name "Nigeria"
  state?: string | null;    // e.g., "LA" (state code) or full "Lagos"
  lga?: string | null;      // e.g., "Ikeja" (usually full name already)
};

const supabase = createClient();


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
    return;
  }

  if (session) {
    const userId = session.user.id;
    const { data: profile, error: profileError } = await supabase
      .from("profiles") 
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
          window.location.href = "/dashboard/volunteer";
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


interface Item {
  id: string;
  label: string;
  children?: Item[];
  subChildren?: Item[];
}

interface Skillset {
  id: string;
  label: string;
  parent_id: string | null;
}

export async function getSkillsets(): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from("skillsets")
      .select("id, label, parent_id")
      .order("id"); // Optional: Ensures consistent ordering

    if (error) {
      throw new Error(`Error fetching skillsets: ${error.message}`);
    }

    // Transform flat skillsets into hierarchical structure
    const topLevel = data.filter((s: Skillset) => s.parent_id === null);
    const transformedItems: Item[] = topLevel.map((top: Skillset) => {
      const children = data
        .filter((s: Skillset) => s.parent_id === top.id)
        .map((child: Skillset) => ({
          id: child.id,
          label: child.label,
          subChildren: data
            .filter((s: Skillset) => s.parent_id === child.id)
            .map((subChild: Skillset) => ({
              id: subChild.id,
              label: subChild.label,
            })),
        }));
      return {
        id: top.id,
        label: top.label,
        children,
      };
    });

    return transformedItems;
  } catch (error: any) {
    toast.error(error.message);
    return [];
  }
}


export async function getUnreadNotificationCount(): Promise<{
  data: number | null;
  error: string | null;
}> {
  try {
    const { data: userId, error: userIdError } = await getUserId();
    if (userIdError) return { data: null, error: userIdError };
    if (!userId) return { data: null, error: "Please log in to check notifications." };

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) return { data: null, error: "Error counting notifications: " + error.message };

    return { data: count, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}



// export type Profile = Database['public']['Tables']['profiles']['Row'];

// export const fetchProfile = async (): Promise<{
//   userId: string | null;
//   profile: Profile | null;
//   error: string | null;
// }> => {
//   const supabase = createClientComponentClient<Database>();

//   try {
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
//     if (userError || !user) {
//       const errorMsg = 'Please log in to view the dashboard.';
//       console.error('fetchProfile: Error fetching user:', userError?.message);
//       toast.error(errorMsg);
//       return { userId: null, profile: null, error: errorMsg };
//     }

//     const { data: profileData, error: profileError } = await supabase
//       .from('profiles')
//       .select(`
//         id,
//         full_name,
//         email,
//         role,
//         phone,
//         date_of_birth,
//         address,
//         skills,
//         availability,
//         experience,
//         residence_country,
//         residence_state,
//         origin_country,
//         origin_state,
//         origin_lga,
//         organization_name,
//         contact_person_first_name,
//         contact_person_last_name,
//         contact_person_email,
//         contact_person_phone,
//         website,
//         organization_type,
//         description,
//         tax_id,
//         focus_areas,
//         environment_cities,
//         environment_states,
//         volunteer_countries,
//         volunteer_states,
//         volunteer_lgas,
//         receives_updates,
//         is_active,
//         profile_picture,
//         updated_at,
//         notification_preferences,
//         deleted_at
//       `)
//       .eq('id', user.id)
//       .single();

//     if (profileError || !profileData) {
//       const errorMsg = 'Profile not found.';
//       console.error('fetchProfile: Error fetching profile:', profileError?.message);
//       toast.error(errorMsg);
//       return { userId: user.id, profile: null, error: errorMsg };
//     }

//     return {
//       userId: user.id,
//       profile: profileData as Profile,
//       error: null,
//     };
//   } catch (err: any) {
//     console.error('fetchProfile: Unexpected error:', err.message);
//     toast.error(err.message);
//     return { userId: null, profile: null, error: err.message };
//   }
// };


// lib/checkAgencyStatus.ts
interface Volunteer {
  id: string;
  role: string;
  is_active?: boolean;
  [key: string]: any;
}

export function checkAgencyStatus(volunteer: Volunteer): {
  status: 'success' | 'error';
  message: string;
  isAgencyActive?: boolean;
} {
  try {
    if (!volunteer || typeof volunteer !== 'object') {
      return { status: 'error', message: 'Invalid volunteer data provided' };
    }
    if (volunteer.role.toLowerCase() !== 'agency') {
      return { status: 'error', message: 'User is not an agency' };
    }
    if (typeof volunteer.is_active !== 'boolean') {
      return { status: 'error', message: 'Agency active status is not defined or invalid' };
    }
    return {
      status: 'success',
      message: `Agency is ${volunteer.is_active ? 'active' : 'inactive'}`,
      isAgencyActive: volunteer.is_active,
    };
  } catch (error: any) {
    return { status: 'error', message: `Error checking agency status: ${error.message}` };
  }
}


export function checkIfAgencyIsActive() {//@ts-ignore
  const { data: userIdData, error: userError } = getUserId();

  if (userError || !userIdData?.userId) {
    toast.error("Please login again");
    return Promise.resolve(false); // Return resolved Promise<boolean>
  }

  return supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userIdData.userId)
    .single()//@ts-ignore
    .then(({ data: profile, error: profileError }) => {
      if (profileError || !profile) {
        toast.error("Failed to fetch user profile");
        return false;
      }

      const isAgencyActive = profile.role === "agency" && profile.is_active === true;

      if (!isAgencyActive) {
        toast.error("Agency account is not active. Contact admin for approval.");
        return false;
      }

      return true; 
    })//@ts-ignore
    .catch((err) => {
      console.error("Unexpected error:", err);
      toast.error("An error occurred checking agency status");
      return false;
    });
}

export async function getPlatformStat  (){
  const { data } = await supabase.rpc('get_platform_stats');
  return data;
}

export function formatLocation(location: LocationData | null): string {
  if (!location || !location.country) {
    return 'Location not specified';
  }

  const parts: string[] = [];

  // Get full country name (from code or use as-is if already full)
  const countryName = Country.getCountryByCode(location.country)?.name || location.country;
  if (!countryName) return 'Unknown location';

  // Handle LGA/City (usually already full name, especially in Nigeria)
  if (location.lga) {
    parts.push(location.lga.trim());
  }
  // Handle State: convert code to full name if possible
  else if (location.state) {
    let stateName: string;

    if (location.country) {
      // Try to get full state name from code
      const state = State.getStatesOfCountry(location.country).find(
        (s) => s.isoCode === location.state || s.name === location.state
      );
      stateName = state?.name || location.state; // fallback to raw if not found
    } else {
      stateName = location.state;
    }

    parts.push(stateName.trim());
  }

  // Always add country at the end
  parts.push(countryName.trim());

  return parts.join(', ');
}

export function convertLocationNamesToCodes({
  selectedCountries = [],
  selectedStates = [],
  selectedLgas = [],
}: {
  selectedCountries?: string[];
  selectedStates?: string[];
  selectedLgas?: string[];
}): {
  countryCodes: string[];     // e.g., ["NG"]
  stateCodes: string[];       // e.g., ["LA", "FC"]
  lgas: string[];             // unchanged full names
} {
  const countryCodes: string[] = [];
  const stateCodes: string[] = [];
  const lgas = [...selectedLgas]; // LGAs stay as full names

  // First: Convert countries to codes
  selectedCountries.forEach((countryName) => {
    // Try hardcoded Nigerian data first (more reliable for Nigeria)
    const nigeriaMatch = africanLocations.find((loc) => loc.country === countryName);
    if (nigeriaMatch) {
      countryCodes.push(nigeriaMatch.countryCode);
      return;
    }

    // Fallback to country-state-city package
    const countryObj = Country.getAllCountries().find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    if (countryObj) {
      countryCodes.push(countryObj.isoCode);
    }
  });

  // Second: Convert states to codes
  selectedStates.forEach((stateName) => {
    let found = false;

    // Prioritize Nigerian states (your accurate hardcoded data)
    for (const loc of africanLocations) {
      const stateData = loc.states.find((s) => s.state === stateName);
      if (stateData) {
        stateCodes.push(stateData.stateCode);
        found = true;
        break;
      }
    }

    if (!found) {
      // Fallback: Use country-state-city (useful if you expand beyond Nigeria later)
      const allStates = State.getAllStates();
      const stateObj = allStates.find((s) => s.name === stateName);
      if (stateObj) {
        stateCodes.push(stateObj.isoCode);
      }
    }
  });

  return {
    countryCodes,
    stateCodes,
    lgas,
  };
}

export function convertLocationCodesToNames({
  countryCodes = [],
  stateCodes = [],
  lgas = [],
}: {
  countryCodes?: string[];
  stateCodes?: string[];
  lgas?: string[];
}) {
  const countries: string[] = [];
  const states: string[] = [];

  countryCodes.forEach((code) => {//@ts-ignore
    const match = nigerianLocations.find((loc) => loc.countryCode === code);
    if (match) countries.push(match.country);
    else {
      const c = Country.getCountryByCode(code);
      if (c) countries.push(c.name);
    }
  });

  stateCodes.forEach((code) => {
    let found = false;//@ts-ignore
    for (const loc of nigerianLocations) {//@ts-ignore
      const state = loc.states.find((s) => s.stateCode === code);
      if (state) {
        states.push(state.state);
        found = true;
        break;
      }
    }
    if (!found) {
      const s = State.getStateByCode(code);
      if (s) states.push(s.name);
    }
  });

  return { countries, states, lgas };
}