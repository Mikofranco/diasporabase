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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Star } from "lucide-react";
import ProjectRecommendation from "../project-recommendation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

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
  volunteer_states: string[];
  average_rating: number;
  request_status?: string;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  created_at: string;
}

interface Deliverable {
  id: string;
  project_id: string | null;
  milestone_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  created_at: string;
}

const ProjectDetails: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [assignedVolunteers, setAssignedVolunteers] = useState<Volunteer[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [rating, setRating] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState<boolean>(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] =
    useState<boolean>(false);
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] =
    useState<boolean>(false);
  const [isMilestoneEditModalOpen, setIsMilestoneEditModalOpen] =
    useState<boolean>(false);
  const [isDeliverableEditModalOpen, setIsDeliverableEditModalOpen] =
    useState<boolean>(false);
  const [projectEditForm, setProjectEditForm] = useState<Partial<Project>>({});
  const [milestoneEditForms, setMilestoneEditForms] = useState<{
    [key: string]: Partial<Milestone>;
  }>({});
  const [deliverableEditForms, setDeliverableEditForms] = useState<{
    [key: string]: Partial<Deliverable>;
  }>({});
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(
    null
  );
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

        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*, required_skills")
          .eq("id", projectId)
          .eq("organization_id", userId)
          .single();

        if (projectError)
          throw new Error("Error fetching project: " + projectError.message);
        if (!projectData)
          throw new Error("Project not found or you don’t have access.");
        setProject(projectData);

        // Fetch milestones
        const { data: milestoneData, error: milestoneError } = await supabase
          .from("milestones")
          .select("*")
          .eq("project_id", projectId)
          .order("due_date", { ascending: true });

        if (milestoneError)
          throw new Error(
            "Error fetching milestones: " + milestoneError.message
          );
        setMilestones(milestoneData || []);
        setMilestoneEditForms(
          milestoneData?.reduce(
            //ts-ignore
            (acc: any, m: any) => ({
              ...acc,
              [m.id]: {
                title: m.title,
                description: m.description,
                due_date: m.due_date,
              },
            }),
            {}
          ) || {}
        );

        // Fetch deliverables
        const { data: deliverableData, error: deliverableError } =
          await supabase
            .from("deliverables")
            .select("*")
            .eq("project_id", projectId)
            .order("due_date", { ascending: true });

        if (deliverableError)
          throw new Error(
            "Error fetching deliverables: " + deliverableError.message
          );
        setDeliverables(deliverableData || []);
        setDeliverableEditForms(
          deliverableData?.reduce(
            //@ts-ignore
            (acc, d) => ({
              ...acc,
              [d.id]: {
                title: d.title,
                description: d.description,
                due_date: d.due_date,
                status: d.status,
              },
            }),
            {}
          ) || {}
        );

        // Fetch volunteers
        const requiredSkills =
          projectData.required_skills?.length > 0
            ? projectData.required_skills
            : ["general"];
        // const { data: volunteerData, error: volunteerError } = await supabase.rpc(
        //   "select_volunteers_for_project",
        //   {
        //     p_project_id: projectId,
        //     p_required_skills: requiredSkills,
        //   }
        // );

        // if (volunteerError) throw new Error("Error fetching volunteers: " + volunteerError.message);
        // if (!volunteerData) throw new Error("No volunteers found.");

        const { data: requestData, error: requestError } = await supabase
          .from("volunteer_requests")
          .select("volunteer_id, status")
          .eq("project_id", projectId);

        if (requestError)
          throw new Error(
            "Error fetching request statuses: " + requestError.message
          );

        // const volunteersWithStatus = volunteerData.map((v: Volunteer) => ({
        //   ...v,
        //   request_status: requestData.find((r: any) => r.volunteer_id === v.volunteer_id)?.status || null,
        // }));
        // setVolunteers(volunteersWithStatus);

        // Fetch assigned volunteers
        const { data: assignedData, error: assignedError } = await supabase
          .from("project_volunteers")
          .select(
            "volunteer_id, profiles!inner(id, full_name, email, skills, availability, residence_country, volunteer_states)"
          )
          .eq("project_id", projectId);

        if (assignedError)
          throw new Error(
            "Error fetching assigned volunteers: " + assignedError.message
          );
        setAssignedVolunteers(
          assignedData?.map((item: any) => ({
            volunteer_id: item.volunteer_id,
            full_name: item.profiles.full_name,
            email: item.profiles.email,
            skills: item.profiles.skills,
            availability: item.profiles.availability,
            residence_country: item.profiles.residence_country,
            volunteer_states: item.profiles.volunteer_states,
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

      if (profileError)
        throw new Error("Error fetching profile: " + profileError.message);

      const { error: ratingError } = await supabase
        .from("project_ratings")
        .insert([
          {
            project_id: project.id,
            user_id: userId,
            user_name: profile.full_name || "Anonymous",
            rating: parseInt(rating),
            comment,
            email: (await supabase.auth.getUser()).data.user?.email || "",
          },
        ]);

      if (ratingError)
        throw new Error("Error submitting rating: " + ratingError.message);
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

      const { error: requestError } = await supabase
        .from("volunteer_requests")
        .insert([
          {
            project_id: project.id,
            volunteer_id: volunteer.volunteer_id,
            status: "pending",
          },
        ]);

      if (requestError)
        throw new Error("Error sending request: " + requestError.message);

      setVolunteers(
        volunteers.map((v) =>
          v.volunteer_id === volunteer.volunteer_id
            ? { ...v, request_status: "pending" }
            : v
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

      if (updateError)
        throw new Error(
          "Error updating project status: " + updateError.message
        );

      setProject((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success(
        `Project ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully!`
      );
      setIsDeactivateDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const openProjectEditModal = () => {
    if (project) {
      setProjectEditForm({
        title: project.title,
        description: project.description,
        location: project.location,
        start_date: project.start_date,
        end_date: project.end_date,
        category: project.category,
      });
      setIsProjectEditModalOpen(true);
    }
  };

  const handleProjectEditSubmit = async () => {
    if (!project) return;

    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to update project details.");

      const { error: projectError } = await supabase
        .from("projects")
        .update({
          title: projectEditForm.title,
          description: projectEditForm.description,
          location: projectEditForm.location,
          start_date: projectEditForm.start_date,
          end_date: projectEditForm.end_date,
          category: projectEditForm.category,
        })
        .eq("id", project.id)
        .eq("organization_id", userId);

      if (projectError)
        throw new Error("Error updating project: " + projectError.message);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              title: projectEditForm.title!,
              description: projectEditForm.description!,
              location: projectEditForm.location!,
              start_date: projectEditForm.start_date!,
              end_date: projectEditForm.end_date!,
              category: projectEditForm.category!,
            }
          : null
      );
      toast.success("Project updated successfully!");
      setIsProjectEditModalOpen(false);
      setProjectEditForm({});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMilestoneEditChange = (
    id: string,
    field: keyof Milestone,
    value: string | null
  ) => {
    setMilestoneEditForms((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleDeliverableEditChange = (
    id: string,
    field: keyof Deliverable,
    value: string | null
  ) => {
    setDeliverableEditForms((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleMilestoneEditSubmit = async () => {
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to update milestones.");

      for (const [id, form] of Object.entries(milestoneEditForms)) {
        if (!form.title || !form.due_date) {
          toast.error(
            `Milestone ${form.title || "Untitled"} is missing required fields.`
          );
          return;
        }
        const { error: milestoneError } = await supabase
          .from("milestones")
          .update({
            title: form.title,
            description: form.description,
            due_date: form.due_date,
          })
          .eq("id", id)
          .eq("project_id", projectId);

        if (milestoneError)
          throw new Error(
            `Error updating milestone ${form.title}: ${milestoneError.message}`
          );
      }

      setMilestones((prev) =>
        prev.map((m) => ({
          ...m,
          ...milestoneEditForms[m.id],
        }))
      );
      toast.success("Milestones updated successfully!");
      setIsMilestoneEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeliverableEditSubmit = async () => {
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to update deliverables.");

      for (const [id, form] of Object.entries(deliverableEditForms)) {
        if (!form.title || !form.due_date || !form.status) {
          toast.error(
            `Deliverable ${
              form.title || "Untitled"
            } is missing required fields.`
          );
          return;
        }
        const { error: deliverableError } = await supabase
          .from("deliverables")
          .update({
            title: form.title,
            description: form.description,
            due_date: form.due_date,
            status: form.status,
          })
          .eq("id", id)
          .eq("project_id", projectId);

        if (deliverableError)
          throw new Error(
            `Error updating deliverable ${form.title}: ${deliverableError.message}`
          );
      }

      setDeliverables((prev) =>
        prev.map((d) => ({
          ...d,
          ...deliverableEditForms[d.id],
        }))
      );
      toast.success("Deliverables updated successfully!");
      setIsDeliverableEditModalOpen(false);
    } catch (err: any) {
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
                  onClick={openProjectEditModal}
                  className="border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors duration-200"
                >
                  Edit Project
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit project details</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* <Button
                  variant={project.status === "active" ? "destructive" : "default"}
                  onClick={() => setIsDeactivateDialogOpen(true)}
                  className={
                    project.status === "active"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }
                >
                  {project.status === "active" ? "Deactivate" : "Activate"} Project
                </Button> */}
              </TooltipTrigger>
              <TooltipContent>
                {project.status === "active"
                  ? "Deactivate this project"
                  : "Activate this project"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-gray-900">
                {project.title}
              </CardTitle>
              <Badge
                variant={
                  project.status === "active"
                    ? "default"
                    : project.status === "cancelled"
                    ? "destructive"
                    : "secondary"
                }
                className={`text-sm ${
                  project.status === "actve" ? "bg-green-600" : ""
                }`}
              >
                {project.status.charAt(0).toUpperCase() +
                  project.status.slice(1)}
              </Badge>
            </div>
            <CardDescription className="text-gray-600">
              {project.organization_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700 leading-relaxed">
              {project.description}
            </p>
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
                    <Badge
                      key={skill}
                      variant="outline"
                      className="ml-1 bg-gray-100"
                    >
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
                  <strong>Volunteers:</strong> {project.volunteers_registered}/
                  {project.volunteers_needed}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Milestones
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMilestoneEditModalOpen(true)}
                className="text-blue-500 border-blue-500 hover:bg-blue-50"
              >
                Edit
              </Button>
            </div>
            {milestones.length === 0 ? (
              <p className="text-gray-500">No milestones defined yet.</p>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <Card key={milestone.id} className="border-0 bg-gray-50">
                    <CardContent className="pt-4">
                      <p className="font-semibold text-gray-900">
                        {milestone.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {milestone.description || "No description"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Due Date:</strong>{" "}
                        {new Date(milestone.due_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Status:</strong> {milestone.status}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Deliverables
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeliverableEditModalOpen(true)}
                className="text-blue-500 border-blue-500 hover:bg-blue-50"
              >
                Edit
              </Button>
            </div>
            {deliverables.length === 0 ? (
              <p className="text-gray-500">No deliverables defined yet.</p>
            ) : (
              <div className="space-y-4">
                {deliverables.map((deliverable) => (
                  <Card key={deliverable.id} className="border-0 bg-gray-50">
                    <CardContent className="pt-4">
                      <p className="font-semibold text-gray-900">
                        {deliverable.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {deliverable.description || "No description"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Due Date:</strong>{" "}
                        {new Date(deliverable.due_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Status:</strong> {deliverable.status}
                      </p>
                      {deliverable.milestone_id && (
                        <p className="text-sm text-gray-600">
                          <strong>Milestone:</strong>{" "}
                          {milestones.find(
                            (m) => m.id === deliverable.milestone_id
                          )?.title || "N/A"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-900 mt-6">
              Assigned Volunteers
            </h3>
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
                      <p className="font-semibold text-gray-900">
                        {volunteer.full_name}
                      </p>
                      <p className="text-sm text-gray-600">{volunteer.email}</p>
                      <p className="text-sm">
                        <strong>Skills:</strong>{" "}
                        {volunteer.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="ml-1 bg-gray-100"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </p>
                      <p className="text-sm">
                        <strong>Availability:</strong> {volunteer.availability}
                      </p>
                      <p className="text-sm">
                        <strong>Location:</strong>{" "}
                        {volunteer.volunteer_states?.length > 0
                          ? volunteer.volunteer_states.join(", ")
                          : "N/A"}
                        , {volunteer.residence_country}
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

            <ProjectRecommendation
              projectId={projectId as string}
              volunteersNeeded={project.volunteers_needed}
              volunteersRegistered={project.volunteers_registered}
            />

            <Dialog
              open={isAssignDialogOpen}
              onOpenChange={setIsAssignDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Volunteer Request</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to send a request to{" "}
                    {selectedVolunteer?.full_name} for {project.title}?
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
                    onClick={() =>
                      selectedVolunteer && handleSendRequest(selectedVolunteer)
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Send Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isDeactivateDialogOpen}
              onOpenChange={setIsDeactivateDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {project.status === "active"
                      ? "Deactivate Project"
                      : "Activate Project"}
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to{" "}
                    {project.status === "active" ? "deactivate" : "activate"}{" "}
                    {project.title}?
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

            <Dialog
              open={isProjectEditModalOpen}
              onOpenChange={setIsProjectEditModalOpen}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Project Details</DialogTitle>
                  <DialogDescription>
                    Update project details below. Required fields are marked
                    with *.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-title">Title *</Label>
                    <Input
                      id="project-title"
                      value={projectEditForm.title || ""}
                      onChange={(e) =>
                        setProjectEditForm({
                          ...projectEditForm,
                          title: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-description">Description *</Label>
                    <Textarea
                      id="project-description"
                      value={projectEditForm.description || ""}
                      onChange={(e) =>
                        setProjectEditForm({
                          ...projectEditForm,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-location">Location *</Label>
                    <Input
                      id="project-location"
                      value={projectEditForm.location || ""}
                      onChange={(e) =>
                        setProjectEditForm({
                          ...projectEditForm,
                          location: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-start-date">Start Date *</Label>
                    <Input
                      id="project-start-date"
                      type="date"
                      value={projectEditForm.start_date || ""}
                      onChange={(e) =>
                        setProjectEditForm({
                          ...projectEditForm,
                          start_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-end-date">End Date *</Label>
                    <Input
                      id="project-end-date"
                      type="date"
                      value={projectEditForm.end_date || ""}
                      onChange={(e) =>
                        setProjectEditForm({
                          ...projectEditForm,
                          end_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-category">Category *</Label>
                    <Input
                      id="project-category"
                      value={projectEditForm.category || ""}
                      onChange={(e) =>
                        setProjectEditForm({
                          ...projectEditForm,
                          category: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsProjectEditModalOpen(false);
                      setProjectEditForm({});
                    }}
                    className="hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProjectEditSubmit}
                    disabled={
                      !projectEditForm.title ||
                      !projectEditForm.description ||
                      !projectEditForm.location ||
                      !projectEditForm.start_date ||
                      !projectEditForm.end_date ||
                      !projectEditForm.category
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isMilestoneEditModalOpen}
              onOpenChange={setIsMilestoneEditModalOpen}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Milestones</DialogTitle>
                  <DialogDescription>
                    Update milestone details below. Required fields are marked
                    with *.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <Card key={milestone.id} className="border-0 bg-gray-50">
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <Label htmlFor={`milestone-title-${milestone.id}`}>
                            Title *
                          </Label>
                          <Input
                            id={`milestone-title-${milestone.id}`}
                            value={
                              milestoneEditForms[milestone.id]?.title || ""
                            }
                            onChange={(e) =>
                              handleMilestoneEditChange(
                                milestone.id,
                                "title",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`milestone-description-${milestone.id}`}
                          >
                            Description
                          </Label>
                          <Textarea
                            id={`milestone-description-${milestone.id}`}
                            value={
                              milestoneEditForms[milestone.id]?.description ||
                              ""
                            }
                            onChange={(e) =>
                              handleMilestoneEditChange(
                                milestone.id,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`milestone-due-date-${milestone.id}`}>
                            Due Date *
                          </Label>
                          <Input
                            id={`milestone-due-date-${milestone.id}`}
                            type="date"
                            value={
                              milestoneEditForms[milestone.id]?.due_date || ""
                            }
                            onChange={(e) =>
                              handleMilestoneEditChange(
                                milestone.id,
                                "due_date",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsMilestoneEditModalOpen(false)}
                    className="hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleMilestoneEditSubmit}
                    disabled={milestones.some(
                      (m) =>
                        !milestoneEditForms[m.id]?.title ||
                        !milestoneEditForms[m.id]?.due_date
                    )}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isDeliverableEditModalOpen}
              onOpenChange={setIsDeliverableEditModalOpen}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Deliverables</DialogTitle>
                  <DialogDescription>
                    Update deliverable details below. Required fields are marked
                    with *.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {deliverables.map((deliverable) => (
                    <Card key={deliverable.id} className="border-0 bg-gray-50">
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <Label
                            htmlFor={`deliverable-title-${deliverable.id}`}
                          >
                            Title *
                          </Label>
                          <Input
                            id={`deliverable-title-${deliverable.id}`}
                            value={
                              deliverableEditForms[deliverable.id]?.title || ""
                            }
                            onChange={(e) =>
                              handleDeliverableEditChange(
                                deliverable.id,
                                "title",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`deliverable-description-${deliverable.id}`}
                          >
                            Description
                          </Label>
                          <Textarea
                            id={`deliverable-description-${deliverable.id}`}
                            value={
                              deliverableEditForms[deliverable.id]
                                ?.description || ""
                            }
                            onChange={(e) =>
                              handleDeliverableEditChange(
                                deliverable.id,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`deliverable-due-date-${deliverable.id}`}
                          >
                            Due Date *
                          </Label>
                          <Input
                            id={`deliverable-due-date-${deliverable.id}`}
                            type="date"
                            value={
                              deliverableEditForms[deliverable.id]?.due_date ||
                              ""
                            }
                            onChange={(e) =>
                              handleDeliverableEditChange(
                                deliverable.id,
                                "due_date",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`deliverable-status-${deliverable.id}`}
                          >
                            Status *
                          </Label>
                          <Select
                            value={
                              deliverableEditForms[deliverable.id]?.status || ""
                            }
                            onValueChange={(value) =>
                              handleDeliverableEditChange(
                                deliverable.id,
                                "status",
                                value
                              )
                            }
                          >
                            <SelectTrigger
                              id={`deliverable-status-${deliverable.id}`}
                            >
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "Done",
                                "Pending",
                                "In Progress",
                                "Cancelled",
                              ].map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeliverableEditModalOpen(false)}
                    className="hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeliverableEditSubmit}
                    disabled={deliverables.some(
                      (d) =>
                        !deliverableEditForms[d.id]?.title ||
                        !deliverableEditForms[d.id]?.due_date ||
                        !deliverableEditForms[d.id]?.status
                    )}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
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
