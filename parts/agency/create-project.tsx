// components/CreateProjectForm.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const supabase = createClient();

// Define schemas for milestones and deliverables
const milestoneSchema = z.object({
  title: z
    .string()
    .min(3, "Milestone title must be at least 3 characters")
    .max(100, "Milestone title must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Milestone description must be 500 characters or less")
    .optional(),
  due_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid due date"),
  status: z.enum(["Done", "Pending", "In Progress", "Cancelled"], {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
});

const deliverableSchema = z.object({
  title: z
    .string()
    .min(3, "Deliverable title must be at least 3 characters")
    .max(100, "Deliverable title must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Deliverable description must be 500 characters or less")
    .optional(),
  due_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid due date"),
  status: z.enum(["Done", "Pending", "In Progress", "Cancelled"], {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
  milestone_id: z.string().optional(), // Stores index as string temporarily
});

// Define base project schema
const baseProjectSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be 1000 characters or less"),
  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(200, "Location must be 200 characters or less"),
  start_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid start date")
    .refine(
      (val) => new Date(val) >= new Date(),
      "Start date must be today or later"
    ),
  end_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must be 50 characters or less"),
  milestones: z
    .array(milestoneSchema)
    .min(1, "At least one milestone is required"),
  deliverables: z
    .array(deliverableSchema)
    .min(1, "At least one deliverable is required"),
});

// Apply refine to create final project schema
const projectSchema = baseProjectSchema.refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  {
    message: "End date must be after start date",
    path: ["end_date"],
  }
);

interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  location: string;
  start_date: string;
  end_date: string;
  volunteers_registered: number;
  status: string;
  category: string;
  created_at: string;
}

interface CreateProjectFormProps {
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  onClose,
  onProjectCreated,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
    category: "",
    milestones: [] as Array<{
      title: string;
      description?: string;
      due_date: string;
      status: "Done" | "Pending" | "In Progress" | "Cancelled";
    }>,
    deliverables: [] as Array<{
      title: string;
      description?: string;
      due_date: string;
      status: "Done" | "Pending" | "In Progress" | "Cancelled";
      milestone_id?: string; // Stores index as string
    }>,
  });
  const [errors, setErrors] = useState<
    z.inferFlattenedErrors<typeof projectSchema>["fieldErrors"]
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to create a project.");

        const { data, error } = await supabase
          .from("profiles")
          .select("id, organization_name")
          .eq("id", userId)
          .single();

        if (error) throw new Error("Error fetching profile: " + error.message);

        setOrganizationId(data.id);
        setOrganizationName(data.organization_name || "Unknown Organization");
      } catch (err: any) {
        setServerError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    console.log("Current form values:", formData);
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    index?: number,
    field?: string
  ) => {
    const { name, value } = e.target;
    if (index !== undefined && field && (name.startsWith("milestones") || name.startsWith("deliverables"))) {
      setFormData((prev) => {
        const newArray = name.startsWith("milestones")
          ? [...prev.milestones]
          : [...prev.deliverables];
        newArray[index] = { ...newArray[index], [field]: value || undefined };
        return {
          ...prev,
          [name.split(".")[0]]: newArray,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { title: "", description: "", due_date: "", status: "Pending" },
      ],
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
      deliverables: prev.deliverables.map((d) =>
        d.milestone_id === String(index)
          ? { ...d, milestone_id: undefined }
          : d
      ),
    }));
  };

  const addDeliverable = () => {
    setFormData((prev) => ({
      ...prev,
      deliverables: [
        ...prev.deliverables,
        { title: "", description: "", due_date: "", status: "Pending", milestone_id: undefined },
      ],
    }));
  };

  const removeDeliverable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  // Define step schemas
  const stepSchemas = {
    1: z.object({
      title: baseProjectSchema.shape.title,
      description: baseProjectSchema.shape.description,
    }),
    2: z
      .object({
        location: baseProjectSchema.shape.location,
        start_date: baseProjectSchema.shape.start_date,
        end_date: baseProjectSchema.shape.end_date,
      })
      .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
        message: "End date must be after start date",
        path: ["end_date"],
      }),
    3: z.object({
      category: baseProjectSchema.shape.category,
    }),
    4: z.object({
      milestones: baseProjectSchema.shape.milestones,
      deliverables: baseProjectSchema.shape.deliverables,
    }),
  };

  const validateStep = (step: number) => {
    const schema = stepSchemas[step as keyof typeof stepSchemas];
    if (!schema) return false;

    const result = schema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      console.log("Step validation errors:", result.error.flatten().fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      toast.error("Please fill out all required fields correctly.");
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const result = projectSchema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      console.log("Form validation errors:", result.error.flatten().fieldErrors);
      toast.error("Please correct the errors in the form.");
      return;
    }

    if (!organizationId) {
      setServerError("Organization ID is missing.");
      toast.error("Organization ID is missing.");
      return;
    }

    setLoading(true);
    try {
      console.log("Submitting form data:", formData);
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            title: formData.title || "Untitled Project",
            description: formData.description,
            organization_id: organizationId,
            organization_name: organizationName,
            location: formData.location,
            start_date: formData.start_date,
            end_date: formData.end_date,
            volunteers_registered: 0,
            status: "pending",
            category: formData.category,
          },
        ])
        .select()
        .single();

      if (projectError || !projectData) {
        throw new Error(projectError ? `Error creating project: ${projectError.message}` : "No project data returned");
      }

      console.log("Project created:", projectData);

      let milestoneIds: string[] = [];
      if (formData.milestones.length > 0) {
        const { data: milestoneData, error: milestoneError } = await supabase
          .from("milestones")
          .insert(
            formData.milestones.map((milestone) => ({
              project_id: projectData.id,
              title: milestone.title,
              description: milestone.description,
              due_date: milestone.due_date,
              status: milestone.status,
            }))
          )
          .select();
        if (milestoneError) throw new Error("Error creating milestones: " + milestoneError.message);
        console.log("Milestones created:", milestoneData);
        milestoneIds = milestoneData.map((m: any) => m.id);
      }

      if (formData.deliverables.length > 0) {
        const { data: deliverableData, error: deliverableError } = await supabase
          .from("deliverables")
          .insert(
            formData.deliverables.map((deliverable) => ({
              project_id: projectData.id,
              milestone_id: deliverable.milestone_id !== undefined && deliverable.milestone_id !== "none"
                ? milestoneIds[parseInt(deliverable.milestone_id)]
                : null,
              title: deliverable.title,
              description: deliverable.description,
              due_date: deliverable.due_date,
              status: deliverable.status,
            }))
          )
          .select();
        if (deliverableError) throw new Error("Error creating deliverables: " + deliverableError.message);
        console.log("Deliverables created:", deliverableData);
      }

      if (!projectData.title) {
        console.warn("Project data missing title:", projectData);
        throw new Error("Project data missing title");
      }

      onProjectCreated(projectData);
      setFormData({
        title: "",
        description: "",
        location: "",
        start_date: "",
        end_date: "",
        category: "",
        milestones: [],
        deliverables: [],
      });
      toast.success("Project created successfully!");
      onClose();
    } catch (err: any) {
      console.error("Submission error:", err);
      setServerError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        {["Basic Info", "Logistics", "Category", "Milestones & Deliverables"].map(
          (label, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= index + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <span className="text-sm mt-1">{label}</span>
            </div>
          )
        )}
      </div>
      <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
    </div>
  );

  const renderStepContent = () => {
    console.log("Rendering step:", currentStep, "Title value:", formData.title);
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-lg font-medium">
                Project Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a compelling project title"
                disabled={loading}
                className="mt-2 h-12 text-base"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description" className="text-lg font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project in detail"
                disabled={loading}
                className="mt-2 h-32 text-base"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description[0]}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="location" className="text-lg font-medium">
                Location *
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter project location"
                disabled={loading}
                className="mt-2 h-12 text-base"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location[0]}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date" className="text-lg font-medium">
                  Start Date *
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-2 h-12 text-base"
                />
                {errors.start_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.start_date[0]}</p>
                )}
              </div>
              <div>
                <Label htmlFor="end_date" className="text-lg font-medium">
                  End Date *
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-2 h-12 text-base"
                />
                {errors.end_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.end_date[0]}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="category" className="text-lg font-medium">
                Category *
              </Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Enter project category"
                disabled={loading}
                className="mt-2 h-12 text-base"
              />
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category[0]}</p>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Milestones *</h3>
              {formData.milestones.length === 0 && (
                <p className="text-red-500 text-sm mt-1">
                  At least one milestone is required.
                </p>
              )}
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="border p-4 rounded-md mb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium">Milestone {index + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor={`milestones.${index}.title`} className="text-lg font-medium">
                      Title *
                    </Label>
                    <Input
                      id={`milestones.${index}.title`}
                      name={`milestones.${index}.title`}
                      value={milestone.title}
                      onChange={(e) => handleChange(e, index, "title")}
                      placeholder="Enter milestone title"
                      disabled={loading}
                      className="mt-2 h-12 text-base"
                    />
                    {errors.milestones?.[index]?.title && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.milestones[index].title}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`milestones.${index}.description`} className="text-lg font-medium">
                      Description
                    </Label>
                    <Textarea
                      id={`milestones.${index}.description`}
                      name={`milestones.${index}.description`}
                      value={milestone.description || ""}
                      onChange={(e) => handleChange(e, index, "description")}
                      placeholder="Enter milestone description (optional)"
                      disabled={loading}
                      className="mt-2 h-32 text-base"
                    />
                    {errors.milestones?.[index]?.description && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.milestones[index].description}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`milestones.${index}.due_date`} className="text-lg font-medium">
                      Due Date *
                    </Label>
                    <Input
                      id={`milestones.${index}.due_date`}
                      name={`milestones.${index}.due_date`}
                      type="date"
                      value={milestone.due_date}
                      onChange={(e) => handleChange(e, index, "due_date")}
                      disabled={loading}
                      className="mt-2 h-12 text-base"
                    />
                    {errors.milestones?.[index]?.due_date && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.milestones[index].due_date}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`milestones.${index}.status`} className="text-lg font-medium">
                      Status *
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleChange(
                          { target: { name: `milestones.${index}.status`, value } } as any,
                          index,
                          "status"
                        )
                      }
                      value={milestone.status}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.milestones?.[index]?.status && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.milestones[index].status}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addMilestone}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-medium">Deliverables *</h3>
              {formData.deliverables.length === 0 && (
                <p className="text-red-500 text-sm mt-1">
                  At least one deliverable is required.
                </p>
              )}
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="border p-4 rounded-md mb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium">Deliverable {index + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDeliverable(index)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor={`deliverables.${index}.title`} className="text-lg font-medium">
                      Title *
                    </Label>
                    <Input
                      id={`deliverables.${index}.title`}
                      name={`deliverables.${index}.title`}
                      value={deliverable.title}
                      onChange={(e) => handleChange(e, index, "title")}
                      placeholder="Enter deliverable title"
                      disabled={loading}
                      className="mt-2 h-12 text-base"
                    />
                    {errors.deliverables?.[index]?.title && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.deliverables[index].title}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`deliverables.${index}.description`} className="text-lg font-medium">
                      Description
                    </Label>
                    <Textarea
                      id={`deliverables.${index}.description`}
                      name={`deliverables.${index}.description`}
                      value={deliverable.description || ""}
                      onChange={(e) => handleChange(e, index, "description")}
                      placeholder="Enter deliverable description (optional)"
                      disabled={loading}
                      className="mt-2 h-32 text-base"
                    />
                    {errors.deliverables?.[index]?.description && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.deliverables[index].description}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`deliverables.${index}.due_date`} className="text-lg font-medium">
                      Due Date *
                    </Label>
                    <Input
                      id={`deliverables.${index}.due_date`}
                      name={`deliverables.${index}.due_date`}
                      type="date"
                      value={deliverable.due_date}
                      onChange={(e) => handleChange(e, index, "due_date")}
                      disabled={loading}
                      className="mt-2 h-12 text-base"
                    />
                    {errors.deliverables?.[index]?.due_date && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.deliverables[index].due_date}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`deliverables.${index}.status`} className="text-lg font-medium">
                      Status *
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleChange(
                          { target: { name: `deliverables.${index}.status`, value } } as any,
                          index,
                          "status"
                        )
                      }
                      value={deliverable.status}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.deliverables?.[index]?.status && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.deliverables[index].status}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`deliverables.${index}.milestone_id`} className="text-lg font-medium">
                      Associated Milestone (Optional)
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleChange(
                          { target: { name: `deliverables.${index}.milestone_id`, value } } as any,
                          index,
                          "milestone_id"
                        )
                      }
                      value={deliverable.milestone_id || "none"}
                      disabled={loading || formData.milestones.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a milestone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {formData.milestones.map((milestone, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {milestone.title || `Milestone ${i + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.deliverables?.[index]?.milestone_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.deliverables[index].milestone_id}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addDeliverable}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Deliverable
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Create New Project
          </DialogTitle>
        </DialogHeader>
        {serverError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-md">
            {serverError}
          </p>
        )}
        {renderStepIndicator()}
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStepContent()}
          <DialogFooter className="flex justify-between mt-6">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                  className="mr-2"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
            <div>
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Creating..." : "Create Project"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectForm;