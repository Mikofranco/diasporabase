"use client";

import { Project, ProjectStatus } from "@/lib/types";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  Building2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ViewTaskModal from "@/components/modals/view-task";
import LeaveProjectModal from "@/components/modals/leave-project";
import { useRouter } from "next/navigation";
import { VolunteerActionButton } from "./volunteer-action-btn";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useSendMail } from "@/services/mail";
import { RatingForm } from "./rating-form";
import { formatLocation } from "@/lib/utils";

const statusConfig: Record<
  ProjectStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: "Pending",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  active: {
    label: "Active",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-green-100 text-green-800 border-green-200",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-800 border-red-200",
  },
};

interface ProjectViewProps {
  project: Project;
  isUserInProject?: boolean;
  hasRequested: boolean;
  setHasRequested: (requested: boolean) => void;
  userID: string | null;
  contactEmail?: string;
  hasRated?: boolean;
  setHasRated?: (rated: boolean) => void;
  onLeaveSuccess?: () => void;
  volunteersRegistered?: number;
}

const ProjectView: React.FC<ProjectViewProps> = ({
  project,
  isUserInProject,
  hasRequested,
  setHasRequested,
  userID,
  contactEmail,
  hasRated,
  setHasRated,
  onLeaveSuccess,
  volunteersRegistered,
}) => {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false); // ← NEW: loading state for request
  //@ts-ignore
  const spotsLeft = project.volunteers_needed - volunteersRegistered || 0;
  const isFull = spotsLeft === 0;
  const formatDate = (date?: string) =>
    date ? format(new Date(date), "EEEE, MMMM d, yyyy") : "Date not set";

  const formatDateRange = () => {
    if (!project.startDate && !project.endDate) return "Dates not set";
    if (!project.startDate) return formatDate(project.endDate);
    if (!project.endDate) return formatDate(project.startDate);
    return `${format(new Date(project.startDate), "MMM d")} – ${format(
      new Date(project.endDate),
      "MMM d, yyyy"
    )}`;
  };

  const handleLeaveSuccess = () => {
    router.push("/dashboard/volunteer/projects");
    router.refresh();
  };

  const status = statusConfig[project.status ?? "pending"];

  const handleVolunteerRequest = async () => {
    if (isRequesting) return; // Prevent double-click

    setIsRequesting(true);

    try {
      const { error } = await supabase.from("volunteer_requests").insert({
        project_id: project.id,
        volunteer_id: userID,
        status: "pending",
        organization_id: project?.organization_id,
      });

      if (error) throw new Error("Error submitting request: " + error.message);

      await useSendMail({
        to: contactEmail || "",
        subject: "New Volunteer Request",
        html: `<p>A new volunteer has requested to join your project: <strong>${project.title}</strong>.</p><p>Please review the request in your dashboard.</p>`,
        onError: (error) => console.error("Email error:", error),
        onSuccess: () => console.log("Email sent"),
      });

      setHasRequested(true);
      toast.success("Request sent! Awaiting approval.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:py-8">
      {/* Hero Header */}
      <div className="mb-8 md:mb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {project.title || "Untitled Project"}
            </h1>
            <p className="text-lg text-muted-foreground flex items-center gap-2 md:text-xl">
              <Building2 className="h-5 w-5 flex-shrink-0" />
              {project.organization_name || "Unknown Organization"}
            </p>
          </div>

          <Badge
            variant="outline"
            className={`self-start px-4 py-2 text-sm font-medium flex items-center gap-2 border-2 ${status.color}`}
          >
            {status.icon}
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Action Sidebar - First on mobile */}
        <div className="lg:order-last lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <Card
              className={`border-2 ${
                isUserInProject
                  ? "border-green-300 bg-green-50/70"
                  : "border-blue-300 bg-blue-50/70"
              }`}
            >
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {isUserInProject ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      You're In!
                    </>
                  ) : (
                    "Join Project"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {isUserInProject
                    ? "You're registered for this project."
                    : "Want to contribute? Join as a volunteer!"}
                </p>

                <Separator />

                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full text-base py-6"
                    data-modal-trigger="contact-organization-modal"
                  >
                    Contact Organizer
                  </Button>

                  {isUserInProject ? (
                    <div className="space-y-3">
                      {project.project_manager_id === userID && (
                        <Button
                          variant="secondary"
                          size="lg"
                          className="w-full text-base py-6"
                          onClick={() =>
                            router.push(
                              `/dashboard/volunteer/project_management/${project.id}`
                            )
                          }
                        >
                          Manage Project
                        </Button>
                      )}
                      <LeaveProjectModal
                        project={{ id: project.id, title: project.title }}
                        onSuccess={handleLeaveSuccess}
                      />
                    </div>
                  ) : (
                    <VolunteerActionButton
                      hasRequested={hasRequested} //@ts-ignore
                      isFull={project.volunteersRegistered >= project.volunteersNeeded}
                      isRequesting={isRequesting}
                      onClick={handleVolunteerRequest}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2 lg:order-first">
          {/* Description */}
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">About This Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {project.description}
                </p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {project.start_date ? formatDate(project.start_date) : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{/*@ts-ignore*/}
                        {formatLocation(project.location) || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Spots Left</p>
                      <p
                        className={`text-sm font-medium ${
                          isFull ? "text-destructive" : "text-green-600"
                        }`}
                      >
                        {spotsLeft} of {project.volunteers_needed || "?"} available
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-sm text-muted-foreground">
                        {project.category || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Required Skills */}
          {project.required_skills && project.required_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="py-1.5 px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ViewTaskModal />
    </div>
  );
};

export default ProjectView;