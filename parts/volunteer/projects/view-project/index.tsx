// app/dashboard/volunteer-projects/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import ProjectView from "./project-view";
import { OrganizationContact, Project, ProjectRating } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import MilestonesView from "./milestones-view";
import DeliverablesView from "./deliverables-view";
import VolunteersList from "./volunteer-list";
import ContactOrganizationModal from "@/components/modals/contact-organizer";
import { getOrganizationContact } from "@/services/agency/dashboard";
import { ReviewsList } from "./review-list";

export default function ViewProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [ratings, setRatings] = useState<ProjectRating[]>([]);
  const [hasRequested, setHasRequested] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isUserInProject, setIsUserInProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [organizationDetails, setOrganizationDetails] =
    useState<OrganizationContact>({
      contact_person_email: "",
      contact_person_first_name: "",
      contact_person_last_name: "",
      contact_person_phone: "",
      organization_name: "",
      website: "",
      description: "",
      organization_type: "",
    });

  // Check if current user is in this project and return user ID
  const checkUserMembership = async (): Promise<{
    isMember: boolean;
    userId: string | null;
  }> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isMember: false, userId: null };
    }
    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("project_volunteers")
      .select("volunteer_id")
      .eq("project_id", id)
      .eq("volunteer_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error checking membership:", error);
    }

    return { isMember: !!data, userId: user.id };
  };

  useEffect(() => {
    if (!id) {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

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

        // 2. Check membership and get user ID
        const { isMember, userId } = await checkUserMembership();
        setIsUserInProject(isMember);

        // Fetch organization contact
        const organizationContactInfo = await getOrganizationContact(
          proj.organization_id
        );
        setOrganizationDetails(organizationContactInfo || {});

        // 3. Fetch shared data (milestones, deliverables, volunteers)
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
            profile_picture: v.profiles?.profile_picture || null,
            joined_at: v.created_at,
          }))
        );

        // 4. Fetch ratings (public)
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("project_ratings")
          .select("user_name, rating, comment, created_at")
          .eq("project_id", id)
          .order("created_at", { ascending: false });

        if (ratingsError) {
          console.error("Error fetching ratings:", ratingsError);
        } else {
          setRatings(ratingsData || []);
        }

        // 5. User-specific checks (only if logged in)
        if (userId) {
          const [requestRes, ratingRes] = await Promise.all([
            supabase
              .from("volunteer_requests")
              .select("id")
              .eq("project_id", id)
              .eq("volunteer_id", userId)
              .eq("status", "pending"),

            supabase
              .from("project_ratings")
              .select("id")
              .eq("project_id", id)
              .eq("user_id", userId),
          ]);

          if (requestRes.error) {
            console.error("Error checking volunteer request:", requestRes.error);
          } else {
            setHasRequested(!!requestRes.data && requestRes.data.length > 0);
          }

          if (ratingRes.error) {
            console.error("Error checking user rating:", ratingRes.error);
          } else {
            setHasRated(!!ratingRes.data && ratingRes.data.length > 0);
          }
        } else {
          setHasRequested(false);
          setHasRated(false);
        }
      } catch (err: any) {
        console.error("Load error:", err);
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleLeaveSuccess = () => {
    router.push("/dashboard/volunteer/projects");
    router.refresh();
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
    <div className="container mx-auto p-6 space-y-16 pb-20 bg-white rounded-lg shadow-sm">
      <section>
        <ProjectView
          project={project}
          isUserInProject={isUserInProject}
          hasRequested={hasRequested}
          setHasRequested={setHasRequested}
          userID={currentUserId} //@ts-ignore
          contactEmail={organizationDetails.contact_person_email}
          hasRated={hasRated}
        />
      </section>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-8">
          <h2 className="text-3xl font-bold">
            Volunteers ({volunteers.length})
          </h2>
          <VolunteersList volunteers={volunteers} />
        </section>

        <aside className="space-y-8 bg-gray-50 p-6 rounded-lg">
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
      {/* <ReviewsList reviews={}/> */}

      <ContactOrganizationModal
        project={{ id: project.id, title: project.title }}
        organization={{
          organization_name: organizationDetails.organization_name,
          contact_person_first_name:
            organizationDetails.contact_person_first_name,
          contact_person_last_name:
            organizationDetails.contact_person_last_name,
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