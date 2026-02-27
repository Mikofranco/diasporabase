"use client";

import React, { useState, useEffect } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  List,
  Globe,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { format } from "date-fns";

interface Volunteer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  profile_picture: string | null;
  skills: string[] | null;
  availability: string | null;
  experience: string | null;
  residence_country: string | null;
  residence_state: string | null;
  origin_country: string | null;
  origin_state: string | null;
  origin_lga: string | null;
  volunteer_countries: string[] | null;
  volunteer_states: string[] | null;
  volunteer_lgas: string[] | null;
  anonymous: boolean | null;
  average_rating: number | null;
  is_active: boolean;
  projects: { id: string; title: string }[];
}

function VolunteerDetailsSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-1.5 text-sm">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-3.5 w-3.5 rounded shrink-0" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      <Card className="overflow-hidden">
        <div className="bg-muted/40 px-6 py-8 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <CardContent className="p-6 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            </div>
          ))}
          <div className="pt-4">
            <Skeleton className="h-10 w-32 rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const AdminVolunteerDetails: React.FC = () => {
  const { volunteerId } = useParams<{ volunteerId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const isSuperAdmin = pathname?.includes("super-admin");
  const volunteersHref = isSuperAdmin ? routes.superAdminVolunteers : routes.adminVolunteers;
  const projectsHref = isSuperAdmin ? routes.superAdminProjects : routes.adminProjects;
  const fromProjectId = searchParams.get("from_project");
  const fromProjectTitle = searchParams.get("from_project_title") || "Project";
  const viewProjectHref = fromProjectId
    ? isSuperAdmin
      ? routes.superAdminViewProject(fromProjectId)
      : routes.adminViewProject(fromProjectId)
    : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push(routes.login);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || !["admin", "super_admin"].includes(profile.role)) {
          toast.error("You do not have permission to view this page.");
          setLoading(false);
          return;
        }

        if (!volunteerId || typeof volunteerId !== "string") {
          toast.error("Invalid volunteer ID");
          setLoading(false);
          return;
        }

        const { data: volunteerData, error: volunteerError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, phone, date_of_birth, address, profile_picture, skills, availability, experience, residence_country, residence_state, origin_country, origin_state, origin_lga, volunteer_countries, volunteer_states, volunteer_lgas, anonymous, average_rating, is_active"
          )
          .eq("id", volunteerId)
          .eq("role", "volunteer")
          .single();

        if (volunteerError || !volunteerData) {
          toast.error("Volunteer not found.");
          setLoading(false);
          return;
        }

        const { data: projectsData } = await supabase
          .from("project_volunteers")
          .select("project:projects(id, title)")
          .eq("volunteer_id", volunteerId);

        const projects = (projectsData ?? [])
          .map((p: { project: { id: string; title: string } | null }) => p.project)
          .filter(Boolean) as { id: string; title: string }[];

        setVolunteer({
          ...volunteerData,
          is_active: volunteerData.is_active ?? true,
          projects,
        });
      } catch (err) {
        toast.error("Error loading volunteer: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [volunteerId, router]);

  const handleToggleActive = async () => {
    if (!volunteer) return;
    setToggling(true);
    try {
      const newStatus = !volunteer.is_active;
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: newStatus })
        .eq("id", volunteerId);

      if (error) throw error;

      setVolunteer((prev) => (prev ? { ...prev, is_active: newStatus } : null));
      toast.success(`Profile ${newStatus ? "activated" : "deactivated"} successfully.`);
    } catch (err) {
      toast.error("Error updating status: " + (err as Error).message);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <VolunteerDetailsSkeleton />;
  }

  if (!volunteer) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">Volunteer not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={volunteersHref}>Back to volunteers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayName = volunteer.full_name?.trim() || volunteer.email || "Volunteer";
  const residenceDisplay = [volunteer.residence_state, volunteer.residence_country]
    .filter(Boolean)
    .join(", ") || "—";
  const originDisplay = [volunteer.origin_country, volunteer.origin_state, volunteer.origin_lga]
    .filter(Boolean)
    .join(", ") || "—";

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Breadcrumb – from project: Projects > Project > Volunteer; else Volunteers > Volunteer */}
      <Breadcrumb>
        <BreadcrumbList>
          {fromProjectId && viewProjectHref ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={projectsHref}>Projects</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={viewProjectHref} className="truncate max-w-[180px] sm:max-w-[280px] inline-block">
                    {fromProjectTitle}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium truncate max-w-[200px] sm:max-w-none">
                  {displayName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={volunteersHref}>Volunteers</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium truncate max-w-[200px] sm:max-w-none">
                  {displayName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header card with avatar, name, status, and Activate/Deactivate */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="bg-muted/40 px-6 py-8 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-background shadow-sm shrink-0">
              <AvatarImage src={volunteer.profile_picture ?? undefined} alt="" />
              <AvatarFallback className="text-2xl bg-diaspora-blue/10 text-diaspora-darkBlue">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground truncate">{displayName}</h1>
              {volunteer.email && (
                <p className="text-muted-foreground text-sm mt-0.5 truncate">{volunteer.email}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge
                  className={cn(
                    "font-medium",
                    volunteer.is_active ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
                  )}
                >
                  {volunteer.is_active ? "Active" : "Inactive"}
                </Badge>
                {volunteer.anonymous && (
                  <Badge variant="secondary">Anonymous profile</Badge>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <Button
                onClick={handleToggleActive}
                disabled={toggling}
                className={cn(
                  "gap-2",
                  volunteer.is_active
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                )}
                aria-label={volunteer.is_active ? "Deactivate profile" : "Activate profile"}
              >
                {toggling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : volunteer.is_active ? (
                  <>
                    <ToggleLeft className="h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {/* Section: Personal information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Personal information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full name</p>
                <p className="font-medium">{volunteer.full_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{volunteer.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of birth</p>
                <p className="font-medium">
                  {volunteer.date_of_birth
                    ? format(new Date(volunteer.date_of_birth), "PPP")
                    : "—"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{volunteer.address || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{volunteer.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{volunteer.email || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Skills & availability */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <List className="h-5 w-5 text-muted-foreground" />
              Skills & availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {volunteer.skills?.length
                  ? volunteer.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill.replace(/_/g, " ")}
                      </Badge>
                    ))
                  : "—"}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Availability</p>
              <p className="font-medium">
                {volunteer.availability === "full-time"
                  ? "Full-time"
                  : volunteer.availability || "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section: Experience & location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              Experience & location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Experience</p>
              <p className="text-sm whitespace-pre-wrap">{volunteer.experience || "—"}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current location</p>
                <p className="font-medium">{residenceDisplay}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Origin / nationality</p>
                <p className="font-medium">{originDisplay}</p>
              </div>
            </div>
            {(volunteer.volunteer_countries?.length ||
              volunteer.volunteer_states?.length ||
              volunteer.volunteer_lgas?.length) ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Volunteer location preferences</p>
                <div className="flex flex-wrap gap-2">
                  {volunteer.volunteer_countries?.map((c) => (
                    <Badge key={c} variant="outline">
                      {c}
                    </Badge>
                  ))}
                  {volunteer.volunteer_states?.slice(0, 6).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                  {(volunteer.volunteer_states?.length ?? 0) > 6 && (
                    <Badge variant="outline">+{(volunteer.volunteer_states?.length ?? 0) - 6} more</Badge>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Section: Rating */}
        {volunteer.average_rating != null && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Number(volunteer.average_rating).toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Average rating (0–5)</p>
            </CardContent>
          </Card>
        )}

        {/* Section: Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {volunteer.projects.length
                ? volunteer.projects.map((project) => (
                    <Badge key={project.id} variant="secondary" className="text-sm">
                      {project.title}
                    </Badge>
                  ))
                : "No projects yet"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminVolunteerDetails;
