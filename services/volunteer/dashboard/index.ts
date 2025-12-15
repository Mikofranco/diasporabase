import { useState, useEffect, useCallback } from "react";
import {
  getProjectsByStatus,
  getVolunteerProjects,
  getProjectById,
  createProject,
  updateProjectStatus,
  getProjectsByUserSkills,
} from "@/services/projects";
import { Project, ProjectStatus } from "@/lib/types";
import { toast } from "sonner";

// Hook to fetch completed projects
export const useFetchCompletedProjects = () => {
  const [completedProjectdata, setCompletedProjectdata] = useState<Project[] | null>(null);
  const [completedProjectError, setCompletedProjectError] = useState<string | null>(null);
  const [completedProjectIsLoading, setCompletedProjectIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCompletedProjects = async () => {
      try {
        const { data: completedProjectdata, error: completedProjectError } = await getProjectsByStatus("completed");
        if (completedProjectError) {
          setCompletedProjectError(completedProjectError);
          setCompletedProjectdata(null);
        } else {
          setCompletedProjectdata(completedProjectdata);
          setCompletedProjectError(null);
        }
      } catch (err) {
        setCompletedProjectError(err instanceof Error ? err.message : "An unexpected error occurred");
        setCompletedProjectdata(null);
      } finally {
        setCompletedProjectIsLoading(false);
      }
    };

    fetchCompletedProjects();
  }, []);

  return { completedProjectdata, completedProjectError, completedProjectIsLoading };
};

// Hook to fetch projects the user is volunteering for
export const useFetchVolunteerProjects = () => {
  const [volunteerProjectdata, setVolunteerProjectdata] = useState<Project[] | null>(null);
  const [volunteerProjectError, setVolunteerProjectError] = useState<string | null>(null);
  const [volunteerProjectIsLoading, setVolunteerProjectIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchVolunteerProjects = async () => {
      try {
        const { data: volunteerProjectdata, error: volunteerProjectError } = await getVolunteerProjects();
        if (volunteerProjectError) {
          setVolunteerProjectError(volunteerProjectError);
          setVolunteerProjectdata(null);
        } else {
          setVolunteerProjectdata(volunteerProjectdata);
          setVolunteerProjectError(null);
        }
      } catch (err) {
        setVolunteerProjectError(err instanceof Error ? err.message : "An unexpected error occurred");
        setVolunteerProjectdata(null);
      } finally {
        setVolunteerProjectIsLoading(false);
      }
    };

    fetchVolunteerProjects();
  }, []);

  return { volunteerProjectdata, volunteerProjectError, volunteerProjectIsLoading };
};

// Hook to fetch a single project by ID
export const useFetchProjectById = (projectId: string) => {
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectIsLoading, setProjectIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data: projectData, error: projectError } = await getProjectById(projectId);
        if (projectError) {
          setProjectError(projectError);
          setProjectData(null);
        } else {
          setProjectData(projectData);
          setProjectError(null);
        }
      } catch (err) {
        setProjectError(err instanceof Error ? err.message : "An unexpected error occurred");
        setProjectData(null);
      } finally {
        setProjectIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  return { projectData, projectError, projectIsLoading };
};

// Hook to create a new project
export const useCreateProject = () => {
  const [createProjectData, setCreateProjectData] = useState<Project | null>(null);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [createProjectIsLoading, setCreateProjectIsLoading] = useState<boolean>(false);

  const create = useCallback(
    async (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
      setCreateProjectIsLoading(true);
      try {
        const { data: newProjectData, error: newProjectError } = await createProject(project);
        if (newProjectError) {
          setCreateProjectError(newProjectError);
          setCreateProjectData(null);
        } else {
          setCreateProjectData(newProjectData);
          setCreateProjectError(null);
        }
      } catch (err) {
        setCreateProjectError(err instanceof Error ? err.message : "An unexpected error occurred");
        setCreateProjectData(null);
      } finally {
        setCreateProjectIsLoading(false);
      }
      return { data: createProjectData, error: createProjectError };
    },
    [createProjectData, createProjectError],
  );

  return { createProjectData, createProjectError, createProjectIsLoading, create };
};

// Hook to update a project's status
export const useUpdateProjectStatus = () => {
  const [updateStatusData, setUpdateStatusData] = useState<Project | null>(null);
  const [updateStatusError, setUpdateStatusError] = useState<string | null>(null);
  const [updateStatusIsLoading, setUpdateStatusIsLoading] = useState<boolean>(false);

  const updateStatus = useCallback(
    async (projectId: string, status: ProjectStatus) => {
      setUpdateStatusIsLoading(true);
      try {
        const { data: updatedProjectData, error: updatedProjectError } = await updateProjectStatus(projectId, status);
        if (updatedProjectError) {
          setUpdateStatusError(updatedProjectError);
          setUpdateStatusData(null);
        } else {
          setUpdateStatusData(updatedProjectData);
          setUpdateStatusError(null);
        }
      } catch (err) {
        setUpdateStatusError(err instanceof Error ? err.message : "An unexpected error occurred");
        setUpdateStatusData(null);
      } finally {
        setUpdateStatusIsLoading(false);
      }
      return { data: updateStatusData, error: updateStatusError };
    },
    [updateStatusData, updateStatusError],
  );

  return { updateStatusData, updateStatusError, updateStatusIsLoading, updateStatus };
};

export const useFetchOngoingProjects = () => {
  const [ongoingProjectdata, setOngoingProjectdata] = useState<Project[] | null>(null);
  const [ongoingProjectError, setOngoingProjectError] = useState<string | null>(null);
  const [ongoingProjectIsLoading, setOngoingProjectIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOngoingProjects = async () => {
      try {
        const { data: ongoingProjectdata, error: ongoingProjectError } = await getProjectsByStatus("active");
        if (ongoingProjectError) {
          setOngoingProjectError(ongoingProjectError);
        //   setOngoingProjectdata(null);
        } else {
          setOngoingProjectdata(ongoingProjectdata);
          // console.log("ongoing project data", ongoingProjectdata)

        //   setOngoingProjectError(null);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "An unexpected error occurred while for ongoing projects")
        setOngoingProjectError(err instanceof Error ? err.message : "An unexpected error occurred");
        setOngoingProjectdata(null);
      } finally {
        setOngoingProjectIsLoading(false);
      }
    };

    fetchOngoingProjects();
  }, []);

  return { ongoingProjectdata, ongoingProjectError, ongoingProjectIsLoading };
};

export const useFetchSkillMatchedProjects = () => {
  const [skillMatchedProjectdata, setSkillMatchedProjectdata] = useState<Project[] | null>(null);
  const [skillMatchedProjectError, setSkillMatchedProjectError] = useState<string | null>(null);
  const [skillMatchedProjectIsLoading, setSkillMatchedProjectIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSkillMatchedProjects = async () => {
      try {
        const { data: skillMatchedProjectdata, error: skillMatchedProjectError } = await getProjectsByUserSkills();
        if (skillMatchedProjectError) {
          console.error("Error fetching skill-matched projects:", skillMatchedProjectError);
          toast.error(`Failed to load skill-matched projects: ${skillMatchedProjectError}`, {
            duration: 4000,
            position: "top-right",
          });
          setSkillMatchedProjectError(skillMatchedProjectError);
          setSkillMatchedProjectdata(null);
        } else {
          console.log("Skill-matched projects data:", skillMatchedProjectdata);
          setSkillMatchedProjectdata(skillMatchedProjectdata);
          setSkillMatchedProjectError(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        console.error("Error fetching skill-matched projects:", errorMessage);
        toast.error(`Failed to load skill-matched projects: ${errorMessage}`, {
          duration: 4000,
          position: "top-right",
        });
        setSkillMatchedProjectError(errorMessage);
        setSkillMatchedProjectdata(null);
      } finally {
        setSkillMatchedProjectIsLoading(false);
      }
    };

    fetchSkillMatchedProjects();
  }, []);

  return { skillMatchedProjectdata, skillMatchedProjectError, skillMatchedProjectIsLoading };
};