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
import { LocationSelects } from "@/components/location-selects";

const supabase = createClient();

const CATEGORIES = [
  "Agriculture",
  "Health",
  "Technology",
  "Construction",
  "Others",
] as const;

// === SCHEMAS ===
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

const baseProjectSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be 1000 characters or less"),
  country: z.string().min(1, "Country is required"),
  state: z.string().optional(),  // ← single string, optional
  lga: z.string().optional(),    // ← single string, optional
  start_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid start date")
    .refine((val) => new Date(val) >= new Date(), "Start date must be today or later"),
  end_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  milestones: z
    .array(milestoneSchema)
    .min(1, "At least one milestone is required"),
  deliverables: z
    .array(deliverableSchema)
    .min(1, "At least one deliverable is required"),
});

const projectSchema = baseProjectSchema.refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  {
    message: "End date must be after start date",
    path: ["end_date"],
  }
);

// === INTERFACES ===
interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  country: string;
  state: string;      // ← single string
  lga: string;        // ← single string
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

// === COMPONENT ===
const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  onClose,
  onProjectCreated,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    country: "",
    state: "",    // ← single
    lga: "",      // ← single
    start_date: "",
    end_date: "",
    category: "" as (typeof CATEGORIES)[number],
    milestones: [] as Array<{
      id: string;
      title: string;
      description?: string;
      due_date: string;
      status: "Done" | "Pending" | "In Progress" | "Cancelled";
    }>,
    deliverables: [] as Array<{
      id: string;
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
    if (index !== undefined && field && (name.includes("milestones") || name.includes("deliverables"))) {
      setFormData((prev) => {
        const array = name.startsWith("milestones") ? [...prev.milestones] : [...prev.deliverables];
        array[index] = { ...array[index], [field]: value || undefined };
        return { ...prev, [name.split(".")[0]]: array };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSelectChange = (
    name: string,
    value: string,
    index?: number,
    field?: string
  ) => {
    if (index !== undefined && field && (name.includes("milestones") || name.includes("deliverables"))) {
      setFormData((prev) => {
        const array = name.startsWith("milestones") ? [...prev.milestones] : [...prev.deliverables];
        array[index] = { ...array[index], [field]: value || undefined };
        return { ...prev, [name.split(".")[0]]: array };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          id: crypto.randomUUID(),
          title: "",
          description: "",
          due_date: "",
          status: "Pending",
        },
      ],
    }));
  };

  const removeMilestone = (index: number) => {
    const milestoneId = formData.milestones[index].id;
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
      deliverables: prev.deliverables.map((d) =>
        d.milestone_id === milestoneId ? { ...d, milestone_id: undefined } : d
      ),
    }));
  };

  const addDeliverable = () => {
    setFormData((prev) => ({
      ...prev,
      deliverables: [
        ...prev.deliverables,
        {
          id: crypto.randomUUID(),
          title: "",
          description: "",
          due_date: "",
          status: "Pending",
          milestone_id: undefined,
        },
      ],
    }));
  };

  const removeDeliverable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  const stepSchemas = {
    1: z.object({
      title: baseProjectSchema.shape.title,
      description: baseProjectSchema.shape.description,
    }),
    2: z
      .object({
        country: baseProjectSchema.shape.country,
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
      toast.error("Please correct the errors in the current step.");
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
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
      toast.error("Organization ID is missing.");
      return;
    }

    setLoading(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: formData.title,
          description: formData.description,
          organization_id: organizationId,
          organization_name: organizationName,
          country: formData.country,
          state: formData.state || null,   // ← single string
          lga: formData.lga || null,       // ← single string
          start_date: formData.start_date,
          end_date: formData.end_date,
          volunteers_registered: 0,
          status: "pending",
          category: formData.category,
        })
        .select()
        .single();

      if (projectError || !projectData) throw new Error(projectError?.message || "Failed to create project");

      const milestoneMap = new Map<string, string>();

      if (formData.milestones.length > 0) {
        const { data: milestoneData, error: milestoneError } = await supabase
          .from("milestones")
          .insert(
            formData.milestones.map((m) => ({
              project_id: projectData.id,
              title: m.title,
              description: m.description,
              due_date: m.due_date,
              status: m.status,
            }))
          )
          .select();

        if (milestoneError) throw new Error(milestoneError.message);
        formData.milestones.forEach((m, i) => {
          milestoneMap.set(m.id, milestoneData[i].id);
        });
      }

      if (formData.deliverables.length > 0) {
        await supabase.from("deliverables").insert(
          formData.deliverables.map((d) => ({
            project_id: projectData.id,
            milestone_id: d.milestone_id ? milestoneMap.get(d.milestone_id) : null,
            title: d.title,
            description: d.description,
            due_date: d.due_date,
            status: d.status,
          }))
        );
      }

      onProjectCreated(projectData);
      toast.success("Project created successfully!");
      onClose();
    } catch (err: any) {
      setServerError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = useCallback(
    () => (
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {["Basic Info", "Location & Dates", "Category", "Milestones & Deliverables"].map((label, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= i + 1
                    ? "bg-[#0284C7] text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-xs mt-1">{label}</span>
            </div>
          ))}
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>
    ),
    [currentStep]
  );

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter project title"
                disabled={loading}
                className="mt-2"
              />
              {errors.title?.[0] && (
                <p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project"
                disabled={loading}
                className="mt-2 h-32"
              />
              {errors.description?.[0] && (
                <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <LocationSelects
              label="Project Location *"
              country={formData.country}
              state={formData.state}
              lga={formData.lga}
              onChangeCountry={(v) => handleSelectChange("country", v)}
              onChangeState={(v) => handleSelectChange("state", v)}
              onChangeLga={(v) => handleSelectChange("lga", v)}
              required={false}
            />
            {errors.country?.[0] && <p className="text-red-500 text-xs -mt-4">{errors.country[0]}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-2"
                />
                {errors.start_date?.[0] && (
                  <p className="text-red-500 text-xs mt-1">{errors.start_date[0]}</p>
                )}
              </div>
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-2"
                />
                {errors.end_date?.[0] && (
                  <p className="text-red-500 text-xs mt-1">{errors.end_date[0]}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => handleSelectChange("category", v)}
                disabled={loading}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category?.[0] && (
                <p className="text-red-500 text-xs mt-1">{errors.category[0]}</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            {/* Milestones */}
            <div>
              <h3 className="text-lg font-medium mb-3">Milestones *</h3>
              {formData.milestones.map((m, i) => (
                <div
                  key={m.id}
                  className="border rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Milestone {i + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMilestone(i)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input
                      name={`milestones.${i}.title`}
                      placeholder="Title *"
                      value={m.title}
                      onChange={(e) => handleChange(e, i, "title")}
                      disabled={loading}
                    />
                    {errors.milestones?.[i]?.title?.[0] && (
                      <p className="text-red-500 text-xs">{errors.milestones[i].title[0]}</p>
                    )}
                    <Textarea
                      name={`milestones.${i}.description`}
                      placeholder="Description (optional)"
                      value={m.description || ""}
                      onChange={(e) => handleChange(e, i, "description")}
                      disabled={loading}
                    />
                    <Input
                      type="date"
                      name={`milestones.${i}.due_date`}
                      value={m.due_date}
                      onChange={(e) => handleChange(e, i, "due_date")}
                      disabled={loading}
                    />
                    {errors.milestones?.[i]?.due_date?.[0] && (
                      <p className="text-red-500 text-xs">{errors.milestones[i].due_date[0]}</p>
                    )}
                    <Select
                      value={m.status}
                      onValueChange={(v) => handleSelectChange(`milestones.${i}.status`, v, i, "status")}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Pending", "In Progress", "Done", "Cancelled"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addMilestone} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" /> Add Milestone
              </Button>
            </div>

            {/* Deliverables */}
            <div>
              <h3 className="text-lg font-medium mb-3">Deliverables *</h3>
              {formData.deliverables.map((d, i) => (
                <div
                  key={d.id}
                  className="border rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Deliverable {i + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDeliverable(i)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input
                      name={`deliverables.${i}.title`}
                      placeholder="Title *"
                      value={d.title}
                      onChange={(e) => handleChange(e, i, "title")}
                      disabled={loading}
                    />
                    {errors.deliverables?.[i]?.title?.[0] && (
                      <p className="text-red-500 text-xs">{errors.deliverables[i].title[0]}</p>
                    )}
                    <Textarea
                      name={`deliverables.${i}.description`}
                      placeholder="Description (optional)"
                      value={d.description || ""}
                      onChange={(e) => handleChange(e, i, "description")}
                      disabled={loading}
                    />
                    <Input
                      type="date"
                      name={`deliverables.${i}.due_date`}
                      value={d.due_date}
                      onChange={(e) => handleChange(e, i, "due_date")}
                      disabled={loading}
                    />
                    <Select
                      value={d.status}
                      onValueChange={(v) => handleSelectChange(`deliverables.${i}.status`, v, i, "status")}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Pending", "In Progress", "Done", "Cancelled"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={d.milestone_id || "none"}
                      onValueChange={(v) =>
                        handleSelectChange(`deliverables.${i}.milestone_id`, v === "none" ? "" : v, i, "milestone_id")
                      }
                      disabled={loading || formData.milestones.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Link to milestone (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {formData.milestones.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title || `Milestone ${formData.milestones.indexOf(m) + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addDeliverable} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" /> Add Deliverable
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [currentStep, formData, errors, loading]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Project</DialogTitle>
        </DialogHeader>

        {serverError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            {serverError}
          </div>
        )}

        {renderStepIndicator()}

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStepContent()}

          <DialogFooter className="flex justify-between mt-8">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevious} disabled={loading}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </div>

            <div>
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-[#0284C7] hover:bg-blue-700"
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="bg-[#0284C7] hover:bg-blue-700">
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