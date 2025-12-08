// components/ProjectView.tsx
import { Project, ProjectStatus } from "@/lib/types";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Tag, Building2, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

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

const statusConfig: Record<
  ProjectStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: { label: "Pending", icon: <AlertCircle className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  active: { label: "Active", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-green-100 text-green-800 border-green-200" },
  completed: { label: "Completed", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-blue-100 text-blue-800 border-blue-200" },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-4 w-4" />, color: "bg-red-100 text-red-800 border-red-200" },
};

interface ProjectViewProps {
  project: Project;
  isUserInProject?: boolean;
}

const ProjectView: React.FC<ProjectViewProps> = ({ project, isUserInProject }) => {
  const spotsLeft = Math.max(0, (project.volunteersNeeded || 0) - (project.volunteersRegistered || 0));
  const isFull = spotsLeft === 0;

  const formatDate = (date?: string) =>
    date ? format(new Date(date), "EEEE, MMMM d, yyyy") : "Date not set";

  const formatDateRange = () => {
    if (!project.startDate && !project.endDate) return "Dates not set";
    if (!project.startDate) return formatDate(project.endDate);
    if (!project.endDate) return formatDate(project.startDate);
    return `${format(new Date(project.startDate), "MMM d")} – ${format(new Date(project.endDate), "MMM d, yyyy")}`;
  };

  const status = statusConfig[project.status ?? "pending"];

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
              {//@ts-ignore
              project.organization_name || "Unknown Organization"}
            </p>
          </div>

          <Badge variant="outline" className={`text-sm px-4 py-2 flex items-center gap-2 border-2 ${status.color}`}>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">About This Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Info Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Project Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{formatDateRange()}</p>
                
                {//@ts-ignore
                project.start_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(project.start_date)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {project.location || "Not specified"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Volunteer Spots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className={`text-3xl font-bold ${isFull ? "text-destructive" : "text-green-600"}`}>
                    {spotsLeft}
                  </span>
                  <span className="text-muted-foreground">
                    of {project.volunteersNeeded || "?"} spots left
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{project.category}</Badge>
              </CardContent>
            </Card>
          </div>

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
                <Button className="w-full" size="lg" data-modal-trigger="view-tasks-modal">
                  View Tasks & Check-In
                </Button>
                <Button variant="outline" className="w-full" size="lg" data-modal-trigger="contact-organization-modal">
                  Contact Organizer
                </Button>
                {/* <Button variant="destructive" className="w-full" size="lg" data-modal-trigger="leave-project-modal">
                  Leave Project
                </Button> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ViewTaskModal/>
    </div>
  );
};

export default ProjectView;