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
  Sparkles,
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
import { useModal } from "@/components/ui/modal";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useSendMail } from "@/services/mail";
import { RatingForm } from "./rating-form";
import { formatLocation } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { getProjectStatusStyle } from "@/parts/agency/projects/filters";
import { useSkillLabels } from "@/hooks/useSkillLabels";
import ProjectLinksManager from "@/parts/agency/projects/view-projects.tsx/projectLinks";

interface ProjectViewProps {
  project: Project;
  isUserInProject?: boolean;
  isUserProjectManager?: boolean;
  hasRequested: boolean;
  setHasRequested: (requested: boolean) => void;
  userID: string | null;
  contactEmail?: string;
  hasRated?: boolean;
  setHasRated?: (rated: boolean) => void;
  onLeaveSuccess?: () => void;
  volunteersRegistered?: number;
  agencyHasSentRequest?: boolean;
  onboardingComplete?: boolean;
}

const ProjectView: React.FC<ProjectViewProps> = ({
  project,
  isUserInProject,
  isUserProjectManager,
  hasRequested,
  setHasRequested,
  userID,
  contactEmail,
  hasRated,
  setHasRated,
  onLeaveSuccess,
  volunteersRegistered,
  agencyHasSentRequest,
  onboardingComplete = true,
}) => {
  const router = useRouter();
  const { open: openContactModal } = useModal("contact-organization-modal");
  const [isRequesting, setIsRequesting] = useState(false);
  //@ts-ignore
  const spotsLeft = project.volunteers_needed - volunteersRegistered || 0;
  const isFull = spotsLeft === 0;
  const formatDate = (date?: string) =>
    date ? format(new Date(date), "EEEE, MMMM d, yyyy") : "Date not set";
  const [showAllSkills, setShowAllSkills] = useState(false);
  const { getLabel } = useSkillLabels();
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
    router.push(routes.volunteerProjects);
    router.refresh();
  };

  const statusConfig = getProjectStatusStyle(project.status ?? "pending");

  const handleContactOrganizer = () => {
    if (!onboardingComplete) {
      toast.info("Complete your profile first to contact organizers.", {
        action: { label: "Complete profile", onClick: () => router.push(routes.volunteerOnboarding) },
      });
      return;
    }
    openContactModal({});
  };

  const handleVolunteerRequest = async () => {
    if (!onboardingComplete) {
      toast.info("Complete your profile to apply. Add your skills so organizers can match you.", {
        action: { label: "Complete profile", onClick: () => router.push(routes.volunteerOnboarding) },
      });
      return;
    }
    if (isRequesting) return;

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
            className={`self-start px-4 py-2 text-sm font-medium border-2 ${statusConfig.className}`}
          >
            {statusConfig.label}
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
                    onClick={handleContactOrganizer}
                  >
                    Contact Organizer
                  </Button>

                  {isUserInProject ? (
                    <div className="space-y-3">
                      <LeaveProjectModal
                        project={{ id: project.id, title: project.title }}
                        onSuccess={handleLeaveSuccess}
                      />
                    </div>
                  ) : agencyHasSentRequest ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full text-base py-6 cursor-not-allowed bg-yellow-200 border-yellow-300 text-yellow-900"
                      disabled
                    >
                      Agency request Pending
                    </Button>
                  ) : !onboardingComplete ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full text-base py-6 border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800"
                      onClick={() => router.push(routes.volunteerOnboarding)}
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Complete profile to apply
                    </Button>
                  ) : (
                    <VolunteerActionButton
                      hasRequested={hasRequested} 
                      isFull={//@ts-ignore
                        project.volunteersRegistered >= project.volunteersNeeded
                      }
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
                <CardTitle className="text-2xl text-diaspora-darkBlue">
                  About This Project
                </CardTitle>
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
                        {project.start_date
                          ? formatDate(project.start_date)
                          : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {/*@ts-ignore*/}
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
                        {spotsLeft} of {project.volunteers_needed || "?"}{" "}
                        available
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

                {project.status === "completed" &&
                  (project.closing_remarks || project.completed_project_link) && (
                    <div className="mt-4 rounded-lg border border-diaspora-blue/25 bg-blue-50/70 p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-diaspora-blue">
                        Project Outcome
                      </h3>

                      {project.closing_remarks && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">
                            Closing Remarks
                          </p>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {project.closing_remarks}
                          </p>
                        </div>
                      )}

                      {project.completed_project_link && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">
                            Outcome Link
                          </p>
                          <a
                            href={project.completed_project_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-diaspora-darkBlue hover:underline break-all"
                          >
                            View Project Outcome
                          </a>
                        </div>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Project links (only visible to volunteers in the project) */}
          {isUserInProject && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl text-diaspora-darkBlue">
                  Project Links
                </CardTitle>
                <CardDescription>
                  Useful links shared by participants and organizers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectLinksManager
                  projectId={project.id}
                  initialLinks={project.project_links || []}
                  currentUserId={userID}
                  canAdd={(project.status ?? "").toLowerCase() !== "completed"}
                  canEditAll={!!isUserProjectManager}
                  canEditOwn={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Required Skills */}
          {project.required_skills && project.required_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-400">Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.required_skills
                    .slice(
                      0,
                      showAllSkills ? project.required_skills.length : 15
                    )
                    .map((skill: string) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="py-1.5 px-3 text-sm font-medium"
                      >
                        {getLabel(skill)}
                      </Badge>
                    ))}
                </div>

                {project.required_skills.length > 10 && (
                  <div className="mt-4">
                    <Button
                      variant="link"
                      className="text-diaspora-blue hover:text-diaspora-blue/90 px-0 h-auto font-medium"
                      onClick={() => setShowAllSkills(!showAllSkills)}
                    >
                      {showAllSkills
                        ? "Show less"
                        : `Show all (${project.required_skills.length})`}
                    </Button>
                  </div>
                )}
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
