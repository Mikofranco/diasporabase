import { findProjectById } from "@/services/projects";
import { Profile, Project, ProjectVolunteer, Volunteer, VolunteerRequest } from "../types";
import { convertLocationCodesToNames } from "../utils";

const STATE_CODE_TO_NAME: Record<string, string> = {
  NG: "Nigeria",
  FC: "Federal Capital Territory",
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

interface ProjectLocation {
  lga: string | null;
  state: string | null;
  country: string | null;
}

export async function matchVolunteersToProjectLocation(
  projectId: string,
  volunteers: Volunteer[]
): Promise<Volunteer[]> {
  const matches: Volunteer[] = [];

  const { data: project, error } = await findProjectById(projectId);
  if (error || !project) {
    console.error('Error fetching project:', error);
    return [];
  }
  // Critical fix: location is stored as a JSON string!
  let location: ProjectLocation;
  try {
    location = typeof project.location === 'string'
      ? JSON.parse(project.location)
      : project.location; // fallback if already parsed
  } catch (parseError) {
    console.error('Failed to parse project location JSON:', parseError);
    return [];
  }

  // Normalize values
  const projLga = project.lga?.trim() || null;
  const projState = project.state?.trim().toUpperCase() || null;
  const projCountry = (project.country?.trim() || 'NG') === 'NG' ? 'Nigeria' : location.country?.trim() || '';
  console.log("Project Location:", { projLga, projState, projCountry });
  convertLocationCodesToNames([project.country]);

  console.log("volunters:", volunteers);


  for (const volunteer of volunteers) {
    let matched = false;
    console.log(`Checking volunteer ${volunteer} for project ${project.id}`);
    // Priority 1: LGA match (most specific)
    if (projLga && projLga !== '') {
      if (volunteer.volunteer_lgas?.includes(projLga)) {
        matched = true;
      }
    }
    // Priority 2: State match
    else if (projState) {
      const stateFullName = STATE_CODE_TO_NAME[projState];
      if (stateFullName && volunteer.volunteer_states?.includes(stateFullName)) {
        matched = true;
      }
    }
    // Priority 3: Country match (fallback)
    else if (projCountry && volunteer.volunteer_countries?.includes(projCountry)) {
      matched = true;
    }

    if (matched) {
      matches.push(volunteer);
    }
  }

  return matches;
}
