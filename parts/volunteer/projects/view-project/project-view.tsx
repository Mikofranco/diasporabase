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
}

const ProjectView: React.FC<ProjectViewProps> = ({
  project,
  isUserInProject,
}) => {
  const spotsLeft = Math.max(
    0,
    (project.volunteersNeeded || 0) - (project.volunteersRegistered || 0)
  );
  const isFull = spotsLeft === 0;
  const router = useRouter();
  const [hasRequested, setHasRequested] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
    console.log("Submitting volunteer request for user:", userId, "to project:", project.organization_id);   
      try {
        const { error } = await supabase
          .from("volunteer_requests")
          .insert({ project_id: project.id, volunteer_id: userId, status: "pending", organization_id: project?.organization_id });
  
        if (error) throw new Error("Error submitting volunteer request: " + error.message);
  
        setHasRequested(true);
        toast.success("Volunteer request submitted successfully!");
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    useEffect(() => {
      const fetchedId= localStorage.getItem("diaspobase_userId") ||  getUserId().then(data => data.data);
      setUserId(fetchedId);
      // const { data: requestData, error: requestError } = await supabase
      //     .from("volunteer_requests")
      //     .select("id")
      //     .eq("project_id", project.id)
      //     .eq("volunteer_id", userId)
      //     .eq("status", "pending");

      //   if (requestError) throw new Error("Error checking volunteer request: " + requestError.message);

    }, []);
  

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
                  {project.required_skills.map((skill) => (
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
          <Card className="sticky top-6 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                You're In!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are successfully registered for this project.
              </p>

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
                    isFull={
                      project.volunteersRegistered >= project.volunteersNeeded
                    }
                    onClick={handleVolunteerRequest}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ViewTaskModal />
    </div>
  );
};

export default ProjectView;
