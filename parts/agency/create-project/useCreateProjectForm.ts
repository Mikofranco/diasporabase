"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { toast } from "sonner";
import MultipleImageUploader, {
  MultipleImageUploaderRef,
} from "@/components/multi-image-uploader";
import SkillsSelector, {
  SkillsSelectorHandle,
  SelectedSkillsData,
} from "@/components/skill-selector";
import {
  INITIAL_FORM_DATA,
  type CreateProjectFormData,
  type Project,
  TOTAL_STEPS,
} from "./types";
import { projectSchema, stepSchemas } from "./schema";

const supabase = createClient();

export function useCreateProjectForm(onClose: () => void, onProjectCreated: (p: Project) => void) {
  const [formData, setFormData] = useState<CreateProjectFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<
    z.inferFlattenedErrors<typeof projectSchema>["fieldErrors"]
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const multipleRef = useRef<MultipleImageUploaderRef>(null);
  const skillsSelectorRef = useRef<SkillsSelectorHandle>(null!);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        if (!cancelled) {
          setOrganizationId(data.id);
          setOrganizationName(data.organization_name || "Unknown Organization");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        if (!cancelled) {
          setServerError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    field?: string,
  ) => {
    const { name, value } = e.target;
    if (
      index !== undefined &&
      field &&
      (name.includes("milestones") || name.includes("deliverables"))
    ) {
      const key = name.startsWith("milestones") ? "milestones" : "deliverables";
      setFormData((prev) => {
        const arr = [...prev[key]];
        arr[index] = { ...arr[index], [field]: value || undefined };
        return { ...prev, [key]: arr };
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
    field?: string,
  ) => {
    if (
      index !== undefined &&
      field &&
      (name.includes("milestones") || name.includes("deliverables"))
    ) {
      const key = name.startsWith("milestones") ? "milestones" : "deliverables";
      setFormData((prev) => {
        const arr = [...prev[key]];
        arr[index] = { ...arr[index], [field]: value || undefined };
        return { ...prev, [key]: arr };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateStep = (step: number): boolean => {
    const schema = stepSchemas[step as keyof typeof stepSchemas];
    if (!schema) return false;
    const result = schema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      toast.error("Please correct the errors in the form.");
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const runCreateProject = async () => {
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
      const multipleUrls = await multipleRef.current?.upload();
      const documents =
        multipleUrls && multipleUrls.length > 0
          ? multipleUrls.map((url, i) => ({ title: `Document ${i + 1}`, url }))
          : [];

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: formData.title,
          description: formData.description,
          organization_id: organizationId,
          organization_name: organizationName,
          country: formData.country,
          state: formData.state || null,
          lga: formData.lga || null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          location: {
            country: formData.country,
            state: formData.state,
            lga: formData.lga,
          },
          volunteers_registered: 0,
          status: "pending",
          category: formData.category,
          required_skills: formData.required_skills,
          documents,
        })
        .select()
        .single();

      if (projectError || !projectData)
        throw new Error(projectError?.message || "Failed to create project");

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
            })),
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
            milestone_id: d.milestone_id
              ? milestoneMap.get(d.milestone_id)
              : null,
            title: d.title,
            description: d.description,
            due_date: d.due_date,
            status: d.status,
          })),
        );
      }

      onProjectCreated(projectData);
      toast.success("Project created successfully!");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSkillsChange = (data: SelectedSkillsData) => {
    const skillIds = data.selectedSkills;
    setFormData((prev) => ({ ...prev, required_skills: skillIds }));
    if (skillIds.length > 0) {
      setErrors((prev) => ({ ...prev, required_skills: undefined }));
    }
  };

  const onDocumentsChange = (files: File[] | undefined) => {
    if ((files?.length ?? 0) > 0) setDocumentsError(null);
  };

  return {
    formData,
    setFormData,
    errors,
    serverError,
    loading,
    currentStep,
    documentsError,
    multipleRef,
    skillsSelectorRef,
    handleChange,
    handleSelectChange,
    handleNext,
    handlePrevious,
    onFormSubmit,
    runCreateProject,
    onSkillsChange,
    onDocumentsChange,
  };
}
