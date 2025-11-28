import { supabase } from "@/lib/supabase/client";
import { OrganizationContact, Project } from "@/lib/types";
import { getUserId } from "@/lib/utils";
import { getActiveProjectForAgecy } from "@/services/projects";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const useFetchActiveProjects = () => {
  const [activeProjectdata, setActiveProjectdata] = useState<Project[] | null>(
    null
  );
  const [activeProjectError, setActiveProjectError] = useState<string | null>(
    null
  );
  const [activeProjectIsLoading, setAtiveProjectIsLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchOngoingProjects = async () => {
      try {
        setAtiveProjectIsLoading(true);

        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) {
          toast.error(userIdError);
          setAtiveProjectIsLoading(false);
          return;
        }

        const { data: ongoingProjectdata, error: ongoingProjectError } =
          await getActiveProjectForAgecy(userId);
        if (ongoingProjectError) {
          setActiveProjectError(ongoingProjectError);
          setAtiveProjectIsLoading(false);
          //   setOngoingProjectdata(null);
        } else {
          setActiveProjectdata(ongoingProjectdata);
          // console.log("ongoing project data", ongoingProjectdata);
          setAtiveProjectIsLoading(false);
          //   setOngoingProjectError(null);
        }
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while for ongoing projects"
        );
        setActiveProjectError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
        setActiveProjectdata(null);
      } finally {
        setAtiveProjectIsLoading(false);
      }
    };

    fetchOngoingProjects();
  }, []);

  return { activeProjectdata, activeProjectError, activeProjectIsLoading };
};

export async function getOrganizationContact(
  organizationId: string
): Promise<OrganizationContact | null> {
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      organization_name,
      contact_person_first_name,
      contact_person_last_name,
      contact_person_email,
      contact_person_phone,
      website,
      description,
      organization_type,
      profile_picture
    `)
    .eq("id", organizationId)
    .eq("role", "agency") 
    .single();

  if (error || !data) {
    console.error("Failed to fetch organization contact:", error?.message);
    return null;
  }

  return data as OrganizationContact;
}
