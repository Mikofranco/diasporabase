import { supabase } from "@/lib/supabase/client";
import { getUserId } from "../../lib/utils";
import { Project, ProjectStatus } from "@/lib/types";

// Fetch projects by status for a user (corrected from previous)
export async function getProjectsByStatus(status: ProjectStatus): Promise<{
  data: Project[] | null;
  error: string | null;
}> {
  try {
    const { data: userData, error: userError } = await getUserId();
    if (userError || !userData) {
      return { data: null, error: userError || "Failed to retrieve user ID" };
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      //   .eq("organization_id", userData.id)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: projects as Project[], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Fetch projects by category for a user
export async function getProjectsByCategory(category: string): Promise<{
  data: Project[] | null;
  error: string | null;
}> {
  try {
    const { data: userData, error: userError } = await getUserId();
    if (userError || !userData) {
      return { data: null, error: userError || "Failed to retrieve user ID" };
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", userData)
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: projects as Project[], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Fetch projects a user is volunteering for (via project_volunteers table)
export async function getVolunteerProjects(): Promise<{
  data: Project[] | null;
  error: string | null;
}> {
  try {
    const { data: userData, error: userError } = await getUserId();
    if (userError || !userData) {
      return { data: null, error: userError || "Failed to retrieve user ID" };
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*, project_volunteers!inner(volunteer_id)")
      .eq("project_volunteers.volunteer_id", userData)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: projects as Project[], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Fetch a single project by ID
export async function getProjectById(projectId: string): Promise<{
  data: Project | null;
  error: string | null;
}> {
  try {
    const { data: userData, error: userError } = await getUserId();
    if (userError || !userData) {
      return { data: null, error: userError || "Failed to retrieve user ID" };
    }

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("organization_id", userData)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: project as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Create a new project
export async function createProject(
  project: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<{
  data: Project | null;
  error: string | null;
}> {
  try {
    const { data: userData, error: userError } = await getUserId();
    if (userError || !userData) {
      return { data: null, error: userError || "Failed to retrieve user ID" };
    }

    const { data: newProject, error } = await supabase
      .from("projects")
      .insert({ ...project, organization_id: userData })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: newProject as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Update a project's status
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<{
  data: Project | null;
  error: string | null;
}> {
  try {
    const { data: userData, error: userError } = await getUserId();
    if (userError || !userData) {
      return { data: null, error: userError || "Failed to retrieve user ID" };
    }

    const { data: updatedProject, error } = await supabase
      .from("projects")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("organization_id", userData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: updatedProject as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Update a project's details
export async function updateProjectDetails(
  projectId: string,
  updates: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>
): Promise<{
  data: Project | null;
  error: string | null;
}> {
  try {
    const { data: userData, error: userError } = await getUserId();
    if (userError || !userData) {
      return { data: null, error: userError || "Failed to retrieve user ID" };
    }

    const { data: updatedProject, error } = await supabase
      .from("projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("organization_id", userData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: updatedProject as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Delete a project
export async function deleteProject(projectId: string): Promise<{
  data: null;
  error: string | null;
}> {
  try {
    const { data: userData, error: userError } = await getUserId();
    if (userError || !userData) {
      return { data: null, error: userError || "Failed to retrieve user ID" };
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("organization_id", userData);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export async function getProjectsByUserSkills(): Promise<{
  data: Project[] | null;
  error: string | null;
}> {
  try {
    const { data: userData, error: userError } = await getUserId();
    if (userError || !userData) {
      return { data: null, error: userError || "Failed to retrieve user ID" };
    }

    // Fetch user skills from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", userData)
      .single();

    if (profileError || !profile?.skills?.length) {
      return {
        data: null,
        error: profileError?.message || "No skills found for user",
      };
    }

    // Fetch projects where required_skills overlap with user skills
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "active")
      .overlaps("required_skills", profile.skills)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return { data: null, error: error.message };
    }

    return { data: projects as Project[], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export async function getActiveProjectForAgecy(organiazation_id: string) {
  const { data: projects, error: projectsError } = await supabase
    .form("projects")
    .select("*")
    .eq("organiazation_id", organiazation_id)
    .eq("status", "active");

  if (projectsError) {
    return { data: null, error: projectsError.message };
  }
  return { data: projects as Project[], error: null };
}

export async function getPendingProjetsForAgecy(organiazation_id: string) {
  const { data: projects, error: projectsError } = await supabase
    .form("projects")
    .select("*")
    .eq("organiazation_id", organiazation_id)
    .eq("status", "pending");

  if (projectsError) {
    return { data: null, error: projectsError.message };
  }
  return { data: projects as Project[], error: null };
}

export async function getCompletedProjetsForAgecy(organiazation_id: string) {
  const { data: projects, error: projectsError } = await supabase
    .form("projects")
    .select("*")
    .eq("organiazation_id", organiazation_id)
    .eq("status", "pending");

  if (projectsError) {
    return { data: null, error: projectsError.message };
  }
  return { data: projects as Project[], error: null };
}

export async function getMileStonesAndDeliverablesForProject(
  project_id: string
) {
  const [milesRes, delsRes] = await Promise.all([
    supabase.from("milestones").select("*").eq("project_id", project_id),
    supabase.from("deliverables").select("*").eq("project_id", project_id),
  ]);
  return { milesRes, delsRes };
}


export async function getProjectManagers(){
  const { data: eligiblePMs , error: dataError} = await supabase
  .from('profiles')
  .select('id, full_name, profile_picture, skills, residence_country, residence_state, experience')
  .eq('role', 'volunteer')
  .contains('skills', ['project_management']);
  if(dataError){
    return {data: null, error: dataError.message};
  }
  return {data: eligiblePMs as Array<{id: string; full_name: string; skills: string[]}>, error: null};
}

export async function notifyProjectManagers(projectId: string, managerIds: string[]){
  const notifications = managerIds.map((managerId) => ({
    user_id: managerId,
    project_id: projectId,
    message: `You have been assigned as a Project Manager for project ID: ${projectId}`,
    read: false,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function assignProjectManagersToProject(projectId: string, selectedVolunteerId: string[]){
const {} =await supabase
  .from('projects')
  .update({ project_manager_id: selectedVolunteerId })
  .eq('id', projectId);

}

export async function checkIfProjectManagerAssigned(projectId: string){
  const { data, error } = await supabase
    .from('projects')
    .select('project_manager_id')
    .eq('id', projectId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data?.project_manager_id, error: null };
}

export async function isAProjectManager(userId: string){
  const { data, error } = await supabase
    .from('profiles')
    .select('skills')
    .eq('id', userId)
    .contains('skills', ['project_management']);

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data && data.length > 0, error: null };
}

export async function findProjectById(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, location->>lga, location->>state, location->>country')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return { data: null, error };
  }

  return { data: data as Project, error: null };
}

export async function checkIfUserIsProjectManager(userId: string, projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('project_manager_id')
    .eq('id', projectId)
    .eq('project_manager_id', userId)
    .single();

  if (error) {
    console.error('Error checking project manager status:', error);
    return { isManager: false, error };
  }

  return { isManager: !!data, error: null };
}