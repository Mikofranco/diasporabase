// app/dashboard/volunteer-projects/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

import ProjectView from "./project-view";
import { OrganizationContact, Project, ProjectRating } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import VolunteersList from "./volunteer-list";
import ContactOrganizationModal from "@/components/modals/contact-organizer";
import { getOrganizationContact } from "@/services/agency/dashboard";
import { checkAgencyRequestsToVolunteer, checkIfUserIsProjectManager, checkUserInProject } from "@/services/projects";
import Comments from "../comments";
import { MilestonesSection } from "@/parts/agency/projects/view-projects.tsx/milestone-section";
import { routes } from "@/lib/routes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
  const [isUserProjectManager, setIsUserProjectManager] = useState(false);
  const [agencyHasSentRequest, setAgencyHasSentRequest] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true); // assume complete until we check

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

        const { hasPendingRequest } = await checkAgencyRequestsToVolunteer(userId as string, id);
        setAgencyHasSentRequest(hasPendingRequest);

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
              "volunteer_id, created_at, profiles!volunteer_id(full_name, profile_picture, email, skills, anonymous, residence_country, residence_state, average_rating)"
            )
            .eq("project_id", id),
        ]);

        setMilestones(milesRes.data || []);
        setDeliverables(delsRes.data || []);

        setVolunteers(
          (volsRes.data || []).map((v: any) => ({
            id: v.volunteer_id,
            volunteer_id: v.volunteer_id,
            full_name: v.profiles?.full_name ?? "",
            email: v.profiles?.email ?? "",
            avatar_url: v.profiles?.profile_picture ?? undefined,
            profile_picture: v.profiles?.profile_picture ?? null,
            joined_at: v.created_at,
            skills: v.profiles?.skills ?? [],
            anonymous: !!v.profiles?.anonymous,
            residence_country: v.profiles?.residence_country ?? undefined,
            residence_state: v.profiles?.residence_state ?? undefined,
            average_rating: typeof v.profiles?.average_rating === "number" ? v.profiles.average_rating : 0,
          }))
        );

        const { isManager, error } = await checkIfUserIsProjectManager(
          userId as string,
          id
        );
        const { isUserInProject, error: volunteerError } = await checkUserInProject(
          userId as string,
          id
        );
        setIsUserInProject(isUserInProject);
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
          const { data: profile } = await supabase
            .from("profiles")
            .select("skills")
            .eq("id", userId)
            .single();
          const skills = profile?.skills ?? [];
          setOnboardingComplete(skills.length > 0);

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
            console.error(
              "Error checking volunteer request:",
              requestRes.error
            );
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
    router.push(routes.volunteerProjects);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white">
        <div className="container mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Skeleton className="h-4 w-20 rounded-full" />
            <span className="text-xs text-muted-foreground/60">&gt;</span>
            <Skeleton className="h-4 w-32 rounded-full" />
          </div>

          {/* Main project overview card skeleton */}
          <div className="rounded-xl border bg-white/70 p-4 shadow-sm sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/3 rounded-lg" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-4 w-40 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-4 w-28 rounded-lg" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-8 w-32 rounded-md" />
              </div>
            </div>
          </div>

          {/* Milestones & volunteers skeleton */}
          <div className="space-y-6">
            <div className="rounded-xl border bg-white/70 p-4 shadow-sm sm:p-5">
              <Skeleton className="mb-4 h-5 w-32 rounded-lg" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3"
                  >
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40 rounded-lg" />
                      <Skeleton className="h-3 w-28 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-white/70 p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-baseline justify-between gap-2">
                <Skeleton className="h-5 w-28 rounded-lg" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-40 rounded-lg" />
                      <Skeleton className="h-3 w-32 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white">
        <div className="container mx-auto max-w-2xl p-6 py-24 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="mb-2 text-lg font-semibold text-destructive">
            {error || "Project not found"}
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            The project you&apos;re looking for might have been removed or is unavailable.
          </p>
          <button
            onClick={() => router.push(routes.volunteerProjects)}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Back to my projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white">
      <div className="container mx-auto max-w-7xl p-4 pb-16 sm:p-6 space-y-10">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={routes.volunteerProjects}>My projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[220px] truncate font-medium sm:max-w-md">
                {project.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Main project overview */}
        <section>
          <ProjectView
            project={project}
            isUserInProject={isUserInProject}
            hasRequested={hasRequested}
            setHasRequested={setHasRequested}
            userID={currentUserId} //@ts-ignore
            contactEmail={organizationDetails.contact_person_email}
            hasRated={hasRated}
            volunteersRegistered={volunteers.length}
            agencyHasSentRequest={agencyHasSentRequest}
            setHasRated={setHasRated}
            onboardingComplete={onboardingComplete}
          />
        </section>

        <Separator />

        {/* Milestones & volunteers */}
        <div className="space-y-8">
          <MilestonesSection
            projectId={project.id}
            canEdit={false}
            volunteers={volunteers}
            milestonesPageHref={routes.volunteerProjectMilestones(project.id)}
          />

          <section className="space-y-4 lg:col-span-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold text-diaspora-darkBlue sm:text-2xl">
                Volunteers
              </h2>
              <span className="text-sm text-muted-foreground">
                {volunteers.length} participant
                {volunteers.length === 1 ? "" : "s"}
              </span>
            </div>
            <VolunteersList
              volunteers={volunteers}
              viewerRole={isUserInProject ? "volunteer_same_project" : "public"}
            />
          </section>
        </div>

        {isUserInProject && (
          <Comments
            projectId={project.id}
            volunteers={volunteers}
            projectTitle={project.title}
          />
        )}
      </div>

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
