// app/dashboard/agency/projects/[projectId]/page.tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Star } from "lucide-react";
import ProjectRecommendation from "../project-recommendation";

const supabase = createClient();

interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  location: string;
  start_date: string;
  end_date: string;
  volunteers_needed: number;
  volunteers_registered: number;
  status: string;
  category: string;
  created_at: string;
  required_skills: string[];
}

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  skills: string[];
  availability: string;
  residence_country: string;
  volunteer_state: string;
  average_rating: number;
  request_status?: string;
}

const ProjectDetails: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [assignedVolunteers, setAssignedVolunteers] = useState<Volunteer[]>([]);
  const [rating, setRating] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState<boolean>(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState<boolean>(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const router = useRouter();
  const { projectId } = useParams();

  useEffect(() => {
    const fetchProjectAndVolunteers = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view project details.");

        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*, required_skills")
          .eq("id", projectId)
          .eq("organization_id", userId)
          .single();

        if (projectError) throw new Error("Error fetching project: " + projectError.message);
        if (!projectData) throw new Error("Project not found or you don’t have access.");

        setProject(projectData);

        const requiredSkills = projectData.required_skills?.length > 0 ? projectData.required_skills : ["general"];
        const { data: volunteerData, error: volunteerError } = await supabase.rpc(
          "select_volunteers_for_project",
          {
            p_project_id: projectId,
            p_required_skills: requiredSkills,
          }
        );

        if (volunteerError) throw new Error("Error fetching volunteers: " + volunteerError.message);
        if (!volunteerData) throw new Error("No volunteers found.");

        const { data: requestData, error: requestError } = await supabase
          .from("volunteer_requests")
          .select("volunteer_id, status")
          .eq("project_id", projectId);

        if (requestError) throw new Error("Error fetching request statuses: " + requestError.message);

        const volunteersWithStatus = volunteerData.map((v: Volunteer) => ({
          ...v,
          request_status: requestData.find((r: any) => r.volunteer_id === v.volunteer_id)?.status || null,
        }));
        setVolunteers(volunteersWithStatus);

        const { data: assignedData, error: assignedError } = await supabase
          .from("project_volunteers")
          .select("volunteer_id, profiles!inner(id, full_name, email, skills, availability, residence_country, volunteer_state)")
          .eq("project_id", projectId);

        if (assignedError) throw new Error("Error fetching assigned volunteers: " + assignedError.message);
        setAssignedVolunteers(
          assignedData?.map((item: any) => ({
            volunteer_id: item.volunteer_id,
            full_name: item.profiles.full_name,
            email: item.profiles.email,
            skills: item.profiles.skills,
            availability: item.profiles.availability,
            residence_country: item.profiles.residence_country,
            volunteer_state: item.profiles.volunteer_state,
            average_rating: 0,
          })) || []
        );
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndVolunteers();
  }, [projectId]);

  const handleRatingSubmit = async () => {
    if (!project || !rating) return;

    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to submit a rating.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      if (profileError) throw new Error("Error fetching profile: " + profileError.message);

      const { error: ratingError } = await supabase.from("project_ratings").insert([
        {
          project_id: project.id,
          user_id: userId,
          user_name: profile.full_name || "Anonymous",
          rating: parseInt(rating),
          comment,
          email: (await supabase.auth.getUser()).data.user?.email || "",
        },
      ]);

      if (ratingError) throw new Error("Error submitting rating: " + ratingError.message);
      setRating("");
      setComment("");
      toast.success("Rating submitted successfully!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleSendRequest = async (volunteer: Volunteer) => {
    if (!project) return;

    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to send requests.");

      const { data: existingRequest } = await supabase
        .from("volunteer_requests")
        .select("id, status")
        .eq("project_id", project.id)
        .eq("volunteer_id", volunteer.volunteer_id)
        .single();

      if (existingRequest) {
        toast.error(`Request already sent (Status: ${existingRequest.status})`);
        return;
      }

      const { data: existingAssignment } = await supabase
        .from("project_volunteers")
        .select("volunteer_id")
        .eq("project_id", project.id)
        .eq("volunteer_id", volunteer.volunteer_id)
        .single();

      if (existingAssignment) {
        toast.error("Volunteer is already assigned to this project.");
        return;
      }

      if (project.volunteers_registered >= project.volunteers_needed) {
        toast.error("Volunteer limit reached for this project.");
        return;
      }

      const { error: requestError } = await supabase.from("volunteer_requests").insert([
        {
          project_id: project.id,
          volunteer_id: volunteer.volunteer_id,
          status: "pending",
        },
      ]);

      if (requestError) throw new Error("Error sending request: " + requestError.message);

      setVolunteers(
        volunteers.map((v) =>
          v.volunteer_id === volunteer.volunteer_id ? { ...v, request_status: "pending" } : v
        )
      );
      toast.success("Request sent to volunteer!");
      setIsAssignDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleToggleStatus = async () => {
    if (!project) return;

    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to update project status.");

      const newStatus = project.status === "active" ? "cancelled" : "active";
      const { error: updateError } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", project.id)
        .eq("organization_id", userId);

      if (updateError) throw new Error("Error updating project status: " + updateError.message);

      setProject((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success(`Project ${newStatus === "active" ? "activated" : "deactivated"} successfully!`);
      setIsDeactivateDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">Project not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/agency/projects")}
              className="border-gray-300 hover:bg-gray-100 transition-colors duration-200"
            >
              Back to Projects
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/agency/projects/${project.id}/edit`)}
                  className="border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors duration-200"
                >
                  Edit Project
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit project details</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={project.status === "active" ? "destructive" : "default"}
                  onClick={() => setIsDeactivateDialogOpen(true)}
                  className={
                    project.status === "active"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }
                >
                  {project.status === "active" ? "Deactivate" : "Activate"} Project
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {project.status === "active" ? "Deactivate this project" : "Activate this project"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-gray-900">{project.title}</CardTitle>
              <Badge
                variant={
                  project.status === "active"
                    ? "default"
                    : project.status === "cancelled"
                    ? "destructive"
                    : "secondary"
                }
                className="text-sm"
              >
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </div>
            <CardDescription className="text-gray-600">{project.organization_name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700 leading-relaxed">{project.description}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <p className="text-gray-700">
                  <strong>Location:</strong> {project.location}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-gray-700">
                  <strong>Category:</strong> {project.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-gray-700">
                  <strong>Skills Needed:</strong>{" "}
                  {project.required_skills?.map((skill) => (
                    <Badge key={skill} variant="outline" className="ml-1 bg-gray-100">
                      {skill}
                    </Badge>
                  )) || "None"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <p className="text-gray-700">
                  <strong>Dates:</strong>{" "}
                  {new Date(project.start_date).toLocaleDateString()} -{" "}
                  {new Date(project.end_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                <p className="text-gray-700">
                  <strong>Volunteers:</strong> {project.volunteers_registered}/{project.volunteers_needed}
                </p>
              </div>
            </div>

            {/* <h3 className="text-lg font-semibold text-gray-900 mt-6">Rate This Project</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="rating" className="text-gray-700">
                  Rating (1-5)
                </Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger id="rating" className="border-gray-300">
                    <SelectValue placeholder="Select a rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} <Star className="inline h-4 w-4 ml-1 text-yellow-400" />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="comment" className="text-gray-700">
                  Comment (optional)
                </Label>
                <Input
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment"
                  className="border-gray-300"
                />
              </div>
              <Button
                onClick={handleRatingSubmit}
                disabled={!rating}
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Submit Rating
              </Button>
            </div> */}

            <h3 className="text-lg font-semibold text-gray-900 mt-6">Assigned Volunteers</h3>
            {assignedVolunteers.length === 0 ? (
              <p className="text-gray-500">No volunteers assigned yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignedVolunteers.map((volunteer) => (
                  <Card
                    key={volunteer.volunteer_id}
                    className="hover:shadow-md transition-shadow duration-200 border-0 bg-gray-50"
                  >
                    <CardContent className="pt-4">
                      <p className="font-semibold text-gray-900">{volunteer.full_name}</p>
                      <p className="text-sm text-gray-600">{volunteer.email}</p>
                      <p className="text-sm">
                        <strong>Skills:</strong>{" "}
                        {volunteer.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="ml-1 bg-gray-100">
                            {skill}
                          </Badge>
                        ))}
                      </p>
                      <p className="text-sm">
                        <strong>Availability:</strong> {volunteer.availability}
                      </p>
                      <p className="text-sm">
                        <strong>Location:</strong> {volunteer.volunteer_state}, {volunteer.residence_country}
                      </p>
                      <p className="text-sm">
                        <strong>Rating:</strong>{" "}
                        <span className="flex items-center">
                          {volunteer.average_rating.toFixed(1)}{" "}
                          <Star className="h-4 w-4 ml-1 text-yellow-400" />
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <ProjectRecommendation projectId={projectId as string} volunteersNeeded={project.volunteers_needed} volunteersRegistered={project.volunteers_registered}/>

            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Volunteer Request</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to send a request to {selectedVolunteer?.full_name} for {project.title}?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAssignDialogOpen(false)}
                    className="hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => selectedVolunteer && handleSendRequest(selectedVolunteer)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Send Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {project.status === "active" ? "Deactivate Project" : "Activate Project"}
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to {project.status === "active" ? "deactivate" : "activate"} {project.title}?
                    {project.status === "active"
                      ? " This will set the project status to 'cancelled'."
                      : " This will set the project status to 'active'."}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeactivateDialogOpen(false)}
                    className="hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleToggleStatus}
                    className={
                      project.status === "active"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }
                  >
                    {project.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default ProjectDetails;