"use client";

import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import React, { useState, useEffect, useCallback } from "react";
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

// Predefined categories
const CATEGORIES = ["Agriculture", "Health", "Technology", "Construction", "Others"];

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
  milestone_id: z.string().optional(),
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
  category: z.enum(CATEGORIES as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
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
    category: "" as typeof CATEGORIES[number],
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
      milestone_id?: string;
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

  const handleSelectChange = (name: string, value: string, index?: number, field?: string) => {
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

  // Define step schemas for progressive validation
  const stepSchemas = {
    1: z.object({
      title: baseProjectSchema.shape.title,
      description: baseProjectSchema.shape.description,
    }),
    2: z.object({
      location: baseProjectSchema.shape.location,
      start_date: baseProjectSchema.shape.start_date,
      end_date: baseProjectSchema.shape.end_date,
    }).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
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
      toast.error("Please correct the errors in the current step.");
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
      setServerError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = useCallback(() => (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        {["Basic Info", "Logistics", "Category", "Milestones & Deliverables"].map(
          (label, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= index + 1
                    ? "bg-[#0284C7] text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <span className="text-xs mt-1">{label}</span>
            </div>
          )
        )}
      </div>
      <Progress value={(currentStep / totalSteps) * 100} className="h-2 bg-gray-200" />
    </div>
  ), [currentStep]);

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Project Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a compelling project title"
                disabled={loading}
                className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-red-500 text-xs mt-1">
                  {errors.title[0]}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Description *
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project in detail"
                disabled={loading}
                className="mt-2 h-24 text-sm border-gray-300 dark:border-gray-700"
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? "description-error" : undefined}
              />
              {errors.description && (
                <p id="description-error" className="text-red-500 text-xs mt-1">
                  {errors.description[0]}
                </p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="location" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Location *
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter project location"
                disabled={loading}
                className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700"
                aria-invalid={!!errors.location}
                aria-describedby={errors.location ? "location-error" : undefined}
              />
              {errors.location && (
                <p id="location-error" className="text-red-500 text-xs mt-1">
                  {errors.location[0]}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Start Date *
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700"
                  aria-invalid={!!errors.start_date}
                  aria-describedby={errors.start_date ? "start_date-error" : undefined}
                />
                {errors.start_date && (
                  <p id="start_date-error" className="text-red-500 text-xs mt-1">
                    {errors.start_date[0]}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="end_date" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  End Date *
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700"
                  aria-invalid={!!errors.end_date}
                  aria-describedby={errors.end_date ? "end_date-error" : undefined}
                />
                {errors.end_date && (
                  <p id="end_date-error" className="text-red-500 text-xs mt-1">
                    {errors.end_date[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="category" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Category *
              </Label>
              <Select
                onValueChange={(value) => handleSelectChange("category", value)}
                value={formData.category}
                disabled={loading}
              >
                <SelectTrigger className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p id="category-error" className="text-red-500 text-xs mt-1">
                  {errors.category[0]}
                </p>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Milestones *</h3>
              {formData.milestones.length === 0 && (
                <p className="text-red-500 text-xs mt-1">
                  At least one milestone is required.
                </p>
              )}
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="border p-4 rounded-md mb-4 bg-white dark:bg-gray-900">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Milestone {index + 1}
                    </h4>
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
                    <Label
                      htmlFor={`milestones.${index}.title`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      Title *
                    </Label>
                    <Input
                      id={`milestones.${index}.title`}
                      name={`milestones.${index}.title`}
                      value={milestone.title}
                      onChange={(e) => handleChange(e, index, "title")}
                      placeholder="Enter milestone title"
                      disabled={loading}
                      className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700"
                      aria-invalid={!!errors.milestones?.[index]?.title}
                      aria-describedby={
                        errors.milestones?.[index]?.title
                          ? `milestones.${index}.title-error`
                          : undefined
                      }
                    />
                    {errors.milestones?.[index]?.title && (
                      <p
                        id={`milestones.${index}.title-error`}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.milestones[index].title}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor={`milestones.${index}.description`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      Description
                    </Label>
                    <Textarea
                      id={`milestones.${index}.description`}
                      name={`milestones.${index}.description`}
                      value={milestone.description || ""}
                      onChange={(e) => handleChange(e, index, "description")}
                      placeholder="Enter milestone description (optional)"
                      disabled={loading}
                      className="mt-2 h-24 text-sm border-gray-300 dark:border-gray-700"
                      aria-invalid={!!errors.milestones?.[index]?.description}
                      aria-describedby={
                        errors.milestones?.[index]?.description
                          ? `milestones.${index}.description-error`
                          : undefined
                      }
                    />
                    {errors.milestones?.[index]?.description && (
                      <p
                        id={`milestones.${index}.description-error`}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.milestones[index].description}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor={`milestones.${index}.due_date`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      Due Date *
                    </Label>
                    <Input
                      id={`milestones.${index}.due_date`}
                      name={`milestones.${index}.due_date`}
                      type="date"
                      value={milestone.due_date}
                      onChange={(e) => handleChange(e, index, "due_date")}
                      disabled={loading}
                      className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700"
                      aria-invalid={!!errors.milestones?.[index]?.due_date}
                      aria-describedby={
                        errors.milestones?.[index]?.due_date
                          ? `milestones.${index}.due_date-error`
                          : undefined
                      }
                    />
                    {errors.milestones?.[index]?.due_date && (
                      <p
                        id={`milestones.${index}.due_date-error`}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.milestones[index].due_date}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor={`milestones.${index}.status`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      Status *
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange(`milestones.${index}.status`, value, index, "status")
                      }
                      value={milestone.status}
                      disabled={loading}
                    >
                      <SelectTrigger className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700">
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
                      <p
                        id={`milestones.${index}.status-error`}
                        className="text-red-500 text-xs mt-1"
                      >
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
                className="text-sm border-gray-300 dark:border-gray-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Deliverables *</h3>
              {formData.deliverables.length === 0 && (
                <p className="text-red-500 text-xs mt-1">
                  At least one deliverable is required.
                </p>
              )}
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="border p-4 rounded-md mb-4 bg-white dark:bg-gray-900">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Deliverable {index + 1}
                    </h4>
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
                    <Label
                      htmlFor={`deliverables.${index}.title`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      Title *
                    </Label>
                    <Input
                      id={`deliverables.${index}.title`}
                      name={`deliverables.${index}.title`}
                      value={deliverable.title}
                      onChange={(e) => handleChange(e, index, "title")}
                      placeholder="Enter deliverable title"
                      disabled={loading}
                      className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700"
                      aria-invalid={!!errors.deliverables?.[index]?.title}
                      aria-describedby={
                        errors.deliverables?.[index]?.title
                          ? `deliverables.${index}.title-error`
                          : undefined
                      }
                    />
                    {errors.deliverables?.[index]?.title && (
                      <p
                        id={`deliverables.${index}.title-error`}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.deliverables[index].title}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor={`deliverables.${index}.description`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      Description
                    </Label>
                    <Textarea
                      id={`deliverables.${index}.description`}
                      name={`deliverables.${index}.description`}
                      value={deliverable.description || ""}
                      onChange={(e) => handleChange(e, index, "description")}
                      placeholder="Enter deliverable description (optional)"
                      disabled={loading}
                      className="mt-2 h-24 text-sm border-gray-300 dark:border-gray-700"
                      aria-invalid={!!errors.deliverables?.[index]?.description}
                      aria-describedby={
                        errors.deliverables?.[index]?.description
                          ? `deliverables.${index}.description-error`
                          : undefined
                      }
                    />
                    {errors.deliverables?.[index]?.description && (
                      <p
                        id={`deliverables.${index}.description-error`}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.deliverables[index].description}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor={`deliverables.${index}.due_date`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      Due Date *
                    </Label>
                    <Input
                      id={`deliverables.${index}.due_date`}
                      name={`deliverables.${index}.due_date`}
                      type="date"
                      value={deliverable.due_date}
                      onChange={(e) => handleChange(e, index, "due_date")}
                      disabled={loading}
                      className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700"
                      aria-invalid={!!errors.deliverables?.[index]?.due_date}
                      aria-describedby={
                        errors.deliverables?.[index]?.due_date
                          ? `deliverables.${index}.due_date-error`
                          : undefined
                      }
                    />
                    {errors.deliverables?.[index]?.due_date && (
                      <p
                        id={`deliverables.${index}.due_date-error`}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.deliverables[index].due_date}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor={`deliverables.${index}.status`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      Status *
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange(`deliverables.${index}.status`, value, index, "status")
                      }
                      value={deliverable.status}
                      disabled={loading}
                    >
                      <SelectTrigger className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700">
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
                      <p
                        id={`deliverables.${index}.status-error`}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.deliverables[index].status}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor={`deliverables.${index}.milestone_id`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      Associated Milestone (Optional)
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange(`deliverables.${index}.milestone_id`, value, index, "milestone_id")
                      }
                      value={deliverable.milestone_id || "none"}
                      disabled={loading || formData.milestones.length === 0}
                    >
                      <SelectTrigger className="mt-2 h-10 text-sm border-gray-300 dark:border-gray-700">
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
                      <p
                        id={`deliverables.${index}.milestone_id-error`}
                        className="text-red-500 text-xs mt-1"
                      >
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
                className="text-sm border-gray-300 dark:border-gray-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Deliverable
              </Button>
            </div>
          </div>
        );
    }
  }, [currentStep, formData, errors, loading]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Create New Project
          </DialogTitle>
        </DialogHeader>
        {serverError && (
          <p className="text-red-500 text-xs mb-4 bg-red-50 dark:bg-red-900/50 p-3 rounded-md">
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
                  className="mr-2 text-sm border-gray-300 dark:border-gray-700"
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
                className="text-sm border-gray-300 dark:border-gray-700"
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
                  className="bg-[#0284C7] hover:bg-blue-700 text-white text-sm"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0284C7] hover:bg-blue-700 text-white text-sm"
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