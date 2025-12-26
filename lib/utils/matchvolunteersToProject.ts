import { findProjectById } from "@/services/projects";
import { Volunteer } from "../types";

// Map Nigerian state codes to the exact names used in volunteer profiles
const STATE_CODE_TO_FULL_NAME: Record<string, string> = {
  FC: "Abuja (FCT)",    // Critical: volunteers use "Abuja (FCT)"
  AB: "Abia",
  AD: "Adamawa",
  AK: "Akwa Ibom",
  AN: "Anambra",
  BA: "Bauchi",
  BY: "Bayelsa",
  BE: "Benue",
  BO: "Borno",
  CR: "Cross River",
  DE: "Delta",
  EB: "Ebonyi",
  ED: "Edo",
  EK: "Ekiti",
  EN: "Enugu",
  GO: "Gombe",
  IM: "Imo",
  JI: "Jigawa",
  KD: "Kaduna",
  KN: "Kano",
  KT: "Katsina",
  KE: "Kebbi",
  KO: "Kogi",
  KW: "Kwara",
  LA: "Lagos",
  NA: "Nasarawa",
  NI: "Niger",
  OG: "Ogun",
  ON: "Ondo",
  OS: "Osun",
  OY: "Oyo",
  PL: "Plateau",
  RI: "Rivers",
  SO: "Sokoto",
  TA: "Taraba",
  YO: "Yobe",
  ZA: "Zamfara",
};

export async function matchVolunteersToProjectLocation(
  projectId: string,
  volunteers: Volunteer[]
): Promise<Volunteer[]> {
  const matches: Volunteer[] = [];

  const { data: project, error } = await findProjectById(projectId);
  if (error || !project) {
    console.error("Error fetching project:", error);
    return [];
  }

  // Parse location JSON if needed
  let parsedLocation: { country?: string; state?: string; lga?: string } = {};
  if (project.location && typeof project.location === "string") {
    try {
      parsedLocation = JSON.parse(project.location);
    } catch (e) {
      console.error("Failed to parse project.location JSON:", e);
    }
  }

  // Normalize project location
  const projLga = project.lga?.trim() || null;
  const projStateCode = project.state?.trim().toUpperCase() || null;
  const projCountryCode = project.country?.trim().toUpperCase() || "NG";

  const projStateName = projStateCode ? STATE_CODE_TO_FULL_NAME[projStateCode] || null : null;
  const projCountryName = projCountryCode === "NG" ? "Nigeria" : projCountryCode;

  for (const volunteer of volunteers) {
    let matched = false;

    // Rule 1: If project specifies LGA → volunteer MUST have that exact LGA
    if (projLga) {
      if (volunteer.volunteer_lgas?.includes(projLga)) {
        matched = true;
      }
    }
    // Rule 2: Else if project specifies state → volunteer MUST have that state
    else if (projStateName) {
      if (volunteer.volunteer_states?.includes(projStateName)) {
        matched = true;
      }
    }
    // Rule 3: Else only country is specified → any volunteer with that country matches
    else if (projCountryName) {
      if (volunteer.volunteer_countries?.includes(projCountryName)) {
        matched = true;
      }
    }

    if (matched) {
      matches.push(volunteer);
    }
  }
  return matches;
}