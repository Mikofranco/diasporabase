// src/components/CreateProjectForm.tsx
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
import { CheckboxReactHookFormMultiple } from "@/components/renderedItems";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { expertiseData } from "@/data/expertise";

// Define the Supabase client
const supabase = createClient();

// Define the Zod schema for form validation
const projectSchema = z
  .object({
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
    volunteers_needed: z
      .number()
      .int()
      .min(1, "At least one volunteer is required"),
    category: z
      .string()
      .min(2, "Category must be at least 2 characters")
      .max(50, "Category must be 50 characters or less"),
    skills: z
      .array(z.string())
      .min(1, "At least one skill is required"),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: "End date must be after start date",
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
    volunteers_needed: 1,
    category: "",
    skills: [] as string[],
  });
  const [errors, setErrors] = useState<
    z.inferFlattenedErrors<typeof projectSchema>["fieldErrors"]
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Fetch organization_id and organization_name
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) {
        setServerError(userIdError);
        setLoading(false);
        return;
      }
      if (!userId) {
        setServerError("Please log in to create a project.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, organization_name")
        .eq("id", userId)
        .single();

      if (error) {
        setServerError("Error fetching profile: " + error.message);
      } else {
        setOrganizationId(data.id);
        setOrganizationName(data.organization_name || "Unknown Organization");
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "volunteers_needed" ? parseInt(value) || 1 : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Define step-specific schemas to avoid direct shape access
  const stepSchemas = {
    1: z.object({
      title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be 100 characters or less"),
      description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description must be 1000 characters or less"),
    }),
    2: z
      .object({
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
        volunteers_needed: z
          .number()
          .int()
          .min(1, "At least one volunteer is required"),
      })
      .refine(
        (data) => new Date(data.end_date) >= new Date(data.start_date),
        {
          message: "End date must be after start date",
          path: ["end_date"],
        }
      ),
    3: z.object({
      category: z
        .string()
        .min(2, "Category must be at least 2 characters")
        .max(50, "Category must be 50 characters or less"),
      skills: z
        .array(z.string())
        .min(1, "At least one skill is required"),
    }),
  };

  const validateStep = (step: number) => {
    const schema = stepSchemas[step as keyof typeof stepSchemas];
    if (!schema) return false;

    const result = schema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
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
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            title: formData.title,
            description: formData.description,
            organization_id: organizationId,
            organization_name: organizationName,
            location: formData.location,
            start_date: formData.start_date,
            end_date: formData.end_date,
            volunteers_needed: formData.volunteers_needed,
            volunteers_registered: 0,
            status: "active",
            category: formData.category,
            required_skills: formData.skills,
          },
        ])
        .select()
        .single();

      if (error) {
        setServerError("Error creating project: " + error.message);
      } else {
        onProjectCreated(data);
      }
    } catch (err: any) {
      setServerError("Unexpected error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        {["Basic Info", "Logistics", "Details"].map((label, index) => (
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
        ))}
      </div>
      <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-lg font-medium">
                Project Title
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
                Description
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
                <p className="text-red-500 text-sm mt-1">
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
              <Label htmlFor="location" className="text-lg font-medium">
                Location
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
                  Start Date
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
                  <p className="text-red-500 text-sm mt-1">
                    {errors.start_date[0]}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="end_date" className="text-lg font-medium">
                  End Date
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
                  <p className="text-red-500 text-sm mt-1">
                    {errors.end_date[0]}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label
                htmlFor="volunteers_needed"
                className="text-lg font-medium"
              >
                Volunteers Needed
              </Label>
              <Input
                id="volunteers_needed"
                name="volunteers_needed"
                type="number"
                value={formData.volunteers_needed}
                onChange={handleChange}
                min="1"
                disabled={loading}
                className="mt-2 h-12 text-base"
              />
              {errors.volunteers_needed && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.volunteers_needed[0]}
                </p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="category" className="text-lg font-medium">
                Category
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
            <div>
              <Label className="text-lg font-medium">Required Skills</Label>
              <CheckboxReactHookFormMultiple
                items={expertiseData}//@ts-ignore
                selected={formData.skills}
                onChange={(selected) =>
                  setFormData((prev) => ({ ...prev, skills: selected }))
                }
                disabled={loading}
                className="mt-2"
              />
              {errors.skills && (
                <p className="text-red-500 text-sm mt-1">{errors.skills[0]}</p>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] p-6">
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