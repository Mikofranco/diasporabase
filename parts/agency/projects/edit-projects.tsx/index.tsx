// app/dashboard/agency/projects/[projectId]/edit/page.tsx
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
  CardFooter,
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
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Calendar, MapPin, Users, Edit2, ArrowLeft } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckboxReactHookFormMultiple } from "@/components/renderedItems";
import { expertiseData } from "@/data/expertise";
import { Badge } from "@/components/ui/badge";

const supabase = createClient();

const formSchema = z
  .object({
    title: z.string().min(1, "Title is required.").trim(),
    description: z.string().min(1, "Description is required.").trim(),
    location: z.string().min(1, "Location is required.").trim(),
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().min(1, "End date is required."),
    volunteers_needed: z
      .number()
      .min(0, "Volunteers needed must be at least 0."),
    status: z.enum(["active", "inactive", "completed"], {
      errorMap: () => ({ message: "Status is required." }),
    }),
    category: z.enum(
      ["community", "education", "environment", "health", "other"],
      {
        errorMap: () => ({ message: "Category is required." }),
      }
    ),
    required_skills: z
      .array(z.string())
      .min(1, "At least one skill is required."),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "End date must be after start date.",
    path: ["end_date"],
  });

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState<boolean>(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState<boolean>(false);
  const [customSkill, setCustomSkill] = useState<string>("");
  const router = useRouter();
  const { projectId } = useParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      start_date: "",
      end_date: "",
      volunteers_needed: 0,
      status: "active" as "active" | "inactive" | "completed",
      category: "community" as
        | "community"
        | "education"
        | "environment"
        | "health"
        | "other",
      required_skills: [],
    },
  });

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

        if (projectError)
          throw new Error("Error fetching project: " + projectError.message);
        if (!projectData)
          throw new Error("Project not found or you don’t have access.");

        setProject(projectData);
        form.reset({
          title: projectData.title,
          description: projectData.description,
          location: projectData.location,
          start_date: new Date(projectData.start_date)
            .toISOString()
            .split("T")[0],
          end_date: new Date(projectData.end_date).toISOString().split("T")[0],
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
  }, [projectId, form]);

  const handleSkillsChange = (skills: string[]) => {
    form.setValue("required_skills", skills, { shouldValidate: true });
  };

  const handleAddCustomSkill = () => {
    const trimmedSkill = customSkill.trim();
    if (trimmedSkill === "") {
      toast.error("Please enter a valid skill.");
      return;
    }
    if (form.getValues("required_skills").includes(trimmedSkill)) {
      toast.error("Skill already added.");
      return;
    }
    const newSkills = [...form.getValues("required_skills"), trimmedSkill];
    form.setValue("required_skills", newSkills, { shouldValidate: true });
    setCustomSkill("");
    toast.success("Custom skill added!");
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!project) return;

    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to update the project.");

      if (data.volunteers_needed < project.volunteers_registered) {
        toast.error(
          `Volunteers needed must be at least ${project.volunteers_registered}.`
        );
        return;
      }

      const { error: updateError } = await supabase
        .from("projects")
        .update({
          title: data.title,
          description: data.description,
          location: data.location,
          start_date: data.start_date,
          end_date: data.end_date,
          // volunteers_needed: data.volunteers_needed,
          status: data.status,
          category: data.category,
          required_skills: data.required_skills,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)
        .eq("organization_id", userId);

      if (updateError)
        throw new Error("Error updating project: " + updateError.message);

      toast.success("Project updated successfully!");
      router.push(`/dashboard/agency/projects/${project.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-1/2 rounded-lg" />
        <Card className="shadow-lg border-0">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-1/2 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-xl text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-red-600">{error}</CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() =>
                router.push(`/dashboard/agency/projects/${projectId}`)
              }
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl text-gray-700">
              Project Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            The requested project could not be found.
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => router.push("/dashboard/agency")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Edit Project: {project.title}
          </h1>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/agency/projects/${project.id}`)
            }
            className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </div>

        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Edit Project Details
            </CardTitle>
            <CardDescription className="text-gray-600">
              Update the details for {project.title}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600">
                          Project Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter project title"
                            className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                            aria-describedby="title-description"
                          />
                        </FormControl>
                        <p
                          id="title-description"
                          className="text-sm text-gray-500 mt-1"
                        >
                          The name of your project.
                        </p>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600 flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter location"
                            className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                            aria-describedby="location-description"
                          />
                        </FormControl>
                        <p
                          id="location-description"
                          className="text-sm text-gray-500 mt-1"
                        >
                          Where the project will take place.
                        </p>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          Start Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                            aria-describedby="start-date-description"
                          />
                        </FormControl>
                        <p
                          id="start-date-description"
                          className="text-sm text-gray-500 mt-1"
                        >
                          When the project begins.
                        </p>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          End Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                            aria-describedby="end-date-description"
                          />
                        </FormControl>
                        <p
                          id="end-date-description"
                          className="text-sm text-gray-500 mt-1"
                        >
                          When the project ends (must be after start date).
                        </p>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="volunteers_needed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          Volunteers Needed
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Enter number of volunteers needed"
                            className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                            min={project.volunteers_registered || 0}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                            aria-describedby="volunteers-needed-description"
                          />
                        </FormControl>
                        <p
                          id="volunteers-needed-description"
                          className="text-sm text-gray-500 mt-1"
                        >
                          Minimum: {project.volunteers_registered} (current
                          registered volunteers).
                        </p>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600">
                          Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          aria-label="Select project status"
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">
                          Current status of the project.
                        </p>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600">
                          Category
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          aria-label="Select project category"
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="community">Community</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="environment">
                              Environment
                            </SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">
                          The category that best describes the project.
                        </p>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="required_skills"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-medium text-gray-600">
                            Required Skills
                          </FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSkillsModalOpen(true)}
                                className="border-gray-300 hover:bg-gray-100 rounded-lg"
                                aria-label="Edit required skills"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Edit skills with checkboxes
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.length > 0 ? (
                            field.value.map((skill) => (
                              <Badge
                                key={skill}
                                className="bg-blue-600 text-white rounded-md"
                              >
                                {skill.charAt(0).toUpperCase() +
                                  skill.slice(1).replace("_", " ")}
                                <button
                                  className="ml-2 text-white hover:text-red-200"
                                  onClick={() =>
                                    handleSkillsChange(
                                      field.value.filter((s) => s !== skill)
                                    )
                                  }
                                  aria-label={`Remove ${skill} skill`}
                                >
                                  &times;
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No skills selected
                            </p>
                          )}
                        </div>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600">
                        Description
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          placeholder="Enter project description"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y h-32"
                          aria-describedby="description-description"
                        />
                      </FormControl>
                      <p
                        id="description-description"
                        className="text-sm text-gray-500 mt-1"
                      >
                        A detailed description of the project.
                      </p>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={() => setIsConfirmDialogOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 rounded-lg transition-colors duration-200"
                        disabled={loading}
                      >
                        Save Changes
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Save updated project details
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(`/dashboard/agency/projects/${project.id}`)
                    }
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 text-lg py-6 rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Dialog
          open={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
        >
          <DialogContent className="sm:max-w-md bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Confirm Project Update
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to save changes to{" "}
                {form.getValues("title")}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(handleSubmit)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isSkillsModalOpen} onOpenChange={setIsSkillsModalOpen}>
          <DialogContent className="sm:max-w-lg bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Select Required Skills
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Choose the skills required for this project or add custom
                skills.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="max-h-60 overflow-y-auto pr-2">
                <CheckboxReactHookFormMultiple
                  items={expertiseData}
                  onChange={handleSkillsChange}
                  initialValues={form.getValues("required_skills") || []}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="custom_skill"
                  className="text-sm font-medium text-gray-600"
                >
                  Add Custom Skill
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="custom_skill"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Enter a custom skill"
                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                    aria-describedby="custom-skill-description"
                  />
                  <Button
                    onClick={handleAddCustomSkill}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Add
                  </Button>
                </div>
                <p
                  id="custom-skill-description"
                  className="text-sm text-gray-500"
                >
                  Add a unique skill not listed above.
                </p>
              </div>
              {form.getValues("required_skills").length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    Selected Skills
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {form.getValues("required_skills").map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-blue-600 text-white rounded-md"
                      >
                        {skill.charAt(0).toUpperCase() +
                          skill.slice(1).replace("_", " ")}
                        <button
                          className="ml-2 text-white hover:text-red-200"
                          onClick={() =>
                            handleSkillsChange(
                              form
                                .getValues("required_skills")
                                .filter((s) => s !== skill)
                            )
                          }
                          aria-label={`Remove ${skill} skill`}
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsSkillsModalOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (form.getValues("required_skills").length === 0) {
                    toast.error("At least one skill is required.");
                    return;
                  }
                  setIsSkillsModalOpen(false);
                  toast.success("Skills updated successfully!");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Save Skills
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default EditProject;
