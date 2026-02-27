import { Volunteer } from "@/lib/types";

export const MAX_RECOMMENDATIONS = 15;

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function mapRpcVolunteer(
  v: Record<string, unknown>,
  requestStatusMap: Map<string, string>,
  requiredSkills: string[]
): Volunteer {
  const volunteerId = v.volunteer_id as string;
  const skills = (v.skills ?? []) as string[];
  return {
    volunteer_id: volunteerId,
    full_name: (v.full_name as string) ?? "",
    email: (v.email as string) ?? "",
    skills,
    availability: v.availability as string | undefined,
    experience: (v.experience as string) ?? undefined,
    anonymous: !!(v.anonymous as boolean),
    residence_country: v.residence_country as string | undefined,
    residence_state: v.residence_state as string | undefined,
    volunteer_countries: (v.volunteer_countries ?? []) as string[],
    volunteer_states: (v.volunteer_states ?? []) as string[],
    volunteer_lgas: (v.volunteer_lgas ?? []) as string[],
    average_rating: (v.average_rating as number) ?? 0,
    request_status: requestStatusMap.get(volunteerId) ?? undefined,
    matched_skills: skills.filter((s) => requiredSkills.includes(s)),
    joined_at: "",
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "accepted":
      return "bg-green-100 text-green-800 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "";
  }
}
