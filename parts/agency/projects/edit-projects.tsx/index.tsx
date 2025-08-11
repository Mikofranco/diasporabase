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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Calendar, MapPin, Users } from "lucide-react";

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
  required_skills: string[];
}

const EditProject: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const router = useRouter();
  const { projectId } = useParams();

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to edit project details.");

        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*, required_skills")
          .eq("id", projectId)
          .eq("organization_id", userId)
          .single();

        if (projectError) throw new Error("Error fetching project: " + projectError.message);
        if (!projectData) throw new Error("Project not found or you don’t have access.");

        setProject(projectData);
        setFormData({
          title: projectData.title,
          description: projectData.description,
          location: projectData.location,
          start_date: projectData.start_date,
          end_date: projectData.end_date,
          volunteers_needed: projectData.volunteers_needed,
          status: projectData.status,
          category: projectData.category,
          required_skills: projectData.required_skills || [],
        });
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(",").map((skill) => skill.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, required_skills: skills }));
  };

  const validateForm = () => {
    if (!formData.title || formData.title.trim() === "") {
      toast.error("Title is required.");
      return false;
    }
    if (!formData.description || formData.description.trim() === "") {
      toast.error("Description is required.");
      return false;
    }
    if (!formData.location || formData.location.trim() === "") {
      toast.error("Location is required.");
      return false;
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error("Start and end dates are required.");
      return false;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error("End date must be after start date.");
      return false;
    }
    if (
      !formData.volunteers_needed ||
      formData.volunteers_needed < (project?.volunteers_registered || 0)
    ) {
      toast.error(
        `Volunteers needed must be at least ${project?.volunteers_registered || 0}.`
      );
      return false;
    }
    if (!formData.status) {
      toast.error("Status is required.");
      return false;
    }
    if (!formData.category) {
      toast.error("Category is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!project || !validateForm()) return;

    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to update the project.");

      const { error: updateError } = await supabase
        .from("projects")
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date,
          volunteers_needed: formData.volunteers_needed,
          status: formData.status,
          category: formData.category,
          required_skills: formData.required_skills,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)
        .eq("organization_id", userId);

      if (updateError) throw new Error("Error updating project: " + updateError.message);

      toast.success("Project updated successfully!");
      router.push(`/dashboard/agency/projects/${project.id}`);
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
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
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
          <h1 className="text-2xl font-bold">Edit Project: {project.title}</h1>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/agency/projects/${project.id}`)}
            className="transition-colors duration-200"
          >
            Back to Project
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Edit Project Details</CardTitle>
            <CardDescription>Update the details for {project.title}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleInputChange}
                  placeholder="Enter project title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleInputChange}
                  placeholder="Enter location"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volunteers_needed">Volunteers Needed</Label>
                <Input
                  id="volunteers_needed"
                  name="volunteers_needed"
                  type="number"
                  value={formData.volunteers_needed || ""}
                  onChange={handleInputChange}
                  placeholder="Enter number of volunteers needed"
                  min={project.volunteers_registered || 0}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || ""}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="required_skills">Required Skills (comma-separated)</Label>
                <Input
                  id="required_skills"
                  name="required_skills"
                  value={formData.required_skills?.join(", ") || ""}
                  onChange={handleSkillsChange}
                  placeholder="e.g., leadership, communication, technical"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                placeholder="Enter project description"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                required
              />
            </div>
            <div className="flex gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setIsConfirmDialogOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                      disabled={loading}
                    >
                      Save Changes
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save updated project details</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/agency/projects/${project.id}`)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Project Update</DialogTitle>
              <DialogDescription>
                Are you sure you want to save changes to {formData.title}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default EditProject;