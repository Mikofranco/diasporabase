// components/ProjectView.tsx
import { Project, ProjectStatus } from "@/lib/types";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
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
import { getUserId } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { useSendMail } from "@/services/mail";
import { RatingForm } from "./rating-form";

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
}) => {
  const spotsLeft = Math.max(
    0,
    (project.volunteersNeeded || 0) - (project.volunteersRegistered || 0)
  );
  const isFull = spotsLeft === 0;
  const router = useRouter();
  useEffect(() => {
    console.log("Is user in project", isUserInProject);
  }, []);

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
    router.push("/dashboard/volunteer/projects"); // Correct absolute path
    router.refresh(); // Optional: refresh server data
  };

  const status = statusConfig[project.status ?? "pending"];

   const handleVolunteerRequest = async () => {   
      try {
        const { error } = await supabase
          .from("volunteer_requests")
          .insert({ project_id: project.id, volunteer_id: userID, status: "pending", organization_id: project?.organization_id });
  
        if (error) throw new Error("Error submitting volunteer request: " + error.message);
        console.log("project", project);
        await useSendMail({
          to: contactEmail || "",
          subject: "New Volunteer Request",
          html: `<p>A new volunteer has requested to join your project: <strong>${project.title}</strong>.</p><p>Please review the request in your dashboard.</p>`,
          onError(error) {
            console.error("Error sending email:", error);
          },
          onSuccess() {
            console.log("Volunteer request email sent successfully.");
          },
        });
  
        setHasRequested(true);
        toast.success("Volunteer request submitted successfully!");
      } catch (err: any) {
        toast.error(err.message);
      }
    };


  return (
    <div className="container mx-auto p-6">
      {/* Hero Header */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {project.title || "Untitled Project"}
            </h1>
            <p className="text-xl text-muted-foreground mt-2 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {
                //@ts-ignore
                project.organization_name || "Unknown Organization"
              }
            </p>
          </div>

          <Badge
            variant="outline"
            className={`text-sm px-4 py-2 flex items-center gap-2 border-2 ${status.color}`}
          >
            {status.icon}
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          {project.description && (
            <Card className="space-y-6">
              <CardHeader>
                <CardTitle className="text-2xl">About This Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    {
                      //@ts-ignore
                      project.start_date && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(project.start_date)}
                        </p>
                      )
                    }
                  </div>

                  <div>
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.location || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm  ${
                          isFull ? "text-destructive" : "text-green-600"
                        }`}
                      >
                        {spotsLeft}
                      </span>
                      <span className="text-muted-foreground">
                        of {project.volunteersNeeded || "?"} spots left
                      </span>
                    </div>
                  </div>

                  <div>
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted">{project.category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {project.required_skills && project.required_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map((skill:any) => (
                    <Badge key={skill} variant="outline" className="py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Action Card */}
        <div className="space-y-6">
          <Card className={`sticky top-6 ${isUserInProject ? "border-green-200 bg-green-50/50" : "border-blue-200 bg-blue-50/50"} `}>
            <CardHeader>
             {isUserInProject ? (
              <CardTitle className="text-2xl flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                You're Registered!
              </CardTitle>
             ) : (
              <CardTitle className="text-2xl">Join This Project</CardTitle>
             )}
            </CardHeader>
            <CardContent className="space-y-4">
             {isUserInProject ? (
              <div className="text-green-500">
                You are currently registered as a volunteer for this project.
              </div>
             ) : (
              <div className="text-gray-500">
                Interested in contributing? Join this project as a volunteer!
              </div>
             )}

              <Separator />

              <div className="space-y-3">
                {/* <Button className="w-full" size="lg" data-modal-trigger="view-tasks-modal">
                  View Tasks & Check-In
                </Button> */}
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  data-modal-trigger="contact-organization-modal"
                >
                  Contact Organizer
                </Button>
                {isUserInProject ? (
                  <LeaveProjectModal
                    project={{ id: project.id, title: project.title }}
                    onSuccess={handleLeaveSuccess}
                  />
                ) : (
                  <VolunteerActionButton
                    hasRequested={hasRequested}
                    isFull={//@ts-ignore
                      project.volunteersRegistered >= project.volunteersNeeded
                    }
                    onClick={handleVolunteerRequest}
                  />
                )}
              </div>
            </CardContent>
          </Card>
          {/* <RatingForm form={} hasRated={hasRated} onSubmit={} /> */}
        </div>
      </div>
      <ViewTaskModal />
    </div>
  );
};

export default ProjectView;
