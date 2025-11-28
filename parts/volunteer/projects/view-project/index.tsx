// app/dashboard/volunteer-projects/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import ProjectView from "./project-view";
import { OrganizationContact, Project } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import MilestonesView from "./milestones-view";
import DeliverablesView from "./deliverables-view";
import VolunteersList from "./volunteer-list";
import LeaveProjectModal from "@/components/modals/leave-project";
import ContactOrganizationModal from "@/components/modals/contact-organizer";
import { getOrganizationContact } from "@/services/agency/dashboard";

export default function ViewProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserInProject, setIsUserInProject] = useState(false);
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationContact>({
    contact_person_email: "",
    contact_person_first_name: "",
    contact_person_last_name: "",
    contact_person_phone: "",
    organization_name: "",
    website: "",
    description: "",
    organization_type: "",
  });

  // Check if current user is in this project
  const checkUserMembership = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("project_volunteers")
      .select("1")
      .eq("project_id", id)
      .eq("volunteer_id", user.id)
      .maybeSingle(); // Use maybeSingle() to avoid error if no row

    return !!data;
  };

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        // 1. Fetch project
        const { data: proj, error: projError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (projError || !proj) throw new Error("Project not found");
        setProject(proj as Project);

        // 2. Check if user is in project
        const isInProject = await checkUserMembership();
        setIsUserInProject(isInProject);

        const organizationContactInfo = await getOrganizationContact(proj.organization_id);
        setOrganizationDetails(organizationContactInfo || {});
        console.log("Organization Contact Info:", organizationContactInfo);

        // 3. Fetch related data in parallel
        const [milesRes, delsRes, volsRes] = await Promise.all([
          supabase.from("milestones").select("*").eq("project_id", id),
          supabase.from("deliverables").select("*").eq("project_id", id),
          supabase
            .from("project_volunteers")
            .select(
              "volunteer_id, created_at, profiles!volunteer_id(full_name, profile_picture, email)"
            )
            .eq("project_id", id),
        ]);

        setMilestones(milesRes.data || []);
        setDeliverables(delsRes.data || []);

        setVolunteers(
          (volsRes.data || []).map((v: any) => ({
            id: v.volunteer_id,
            full_name: v.profiles?.full_name || "Anonymous",
            email: v.profiles?.email || "",
            profile_picture: v.profiles?.profile_picture,
            joined_at: v.created_at,
          }))
        );
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    }


    loadData();
  }, [id]);

  const handleLeaveSuccess = () => {
    router.push("/dashboard/volunteer/projects"); // Correct absolute path
    router.refresh(); // Optional: refresh server data
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-64 w-full mt-8" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6 text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <p className="text-lg text-destructive">
          {error || "Project not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-16 pb-20">
      <section>
        <ProjectView project={project} />
      </section>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-8">
          <h2 className="text-3xl font-bold">
            Volunteers ({volunteers.length})
          </h2>
          <VolunteersList volunteers={volunteers} />
        </section>

        <aside className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">Milestones</h2>
            <MilestonesView milestones={milestones} />
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-4">Deliverables</h2>
            <DeliverablesView deliverables={deliverables} />
          </section>
        </aside>
      </div>

      <Separator />

      {/* Only show Leave button if user is in the project */}
      {/* {isUserInProject && ( */}
        <div className="flex justify-center">
          <LeaveProjectModal
            project={{ id: project.id, title: project.title }}
            onSuccess={handleLeaveSuccess}
          />
        </div>
      {/* )} */}

      <ContactOrganizationModal
        project={{ id: project.id, title: project.title }}
        organization={{
          organization_name: organizationDetails.organization_name,
          contact_person_first_name: organizationDetails.contact_person_first_name,
          contact_person_last_name: organizationDetails.contact_person_last_name,
          contact_person_email: organizationDetails.contact_person_email,
          contact_person_phone: organizationDetails.contact_person_phone,
          website: organizationDetails.website,
          description: organizationDetails.description,
          organization_type: organizationDetails.organization_type,
        }}
      />
    </div>
  );
}
