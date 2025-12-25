"use client";
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { formatLocation } from "@/lib/utils";

// Zod schema for validation
const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required").refine(
    (endDate) => new Date(endDate) >= new Date(),
    { message: "End date must be today or later" }
  ),
  category: z.string().min(1, "Category is required"),
  milestones: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1, "Milestone title is required"),
      description: z.string().optional(),
      due_date: z.string().min(1, "Due date is required"),
      status: z.enum(["Done", "Pending", "In Progress", "Cancelled"]),
    })
  ).optional(),
  deliverables: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1, "Deliverable title is required"),
      description: z.string().optional(),
      status: z.enum(["Done", "Pending", "In Progress", "Cancelled"]),
    })
  ).optional(),
});

interface EditProjectDialogueProps {
  project?: Project & {
    milestones?: { id: string; title: string; description?: string; due_date: string; status: string }[];
    deliverables?: { id: string; title: string; description?: string; status: string }[];
  };
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const EditProjectDialogue: React.FC<EditProjectDialogueProps> = ({ project, isOpen, setIsOpen }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? { ...project, milestones: project.milestones || [], deliverables: project.deliverables || [] }
      : {
          title: "",
          description: "",
          location: "",
          start_date: "",
          end_date: "",
          category: "",
          milestones: [],
          deliverables: [],
        },
  });

  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestone } = useFieldArray({
    control,
    name: "milestones",
  });

  const { fields: deliverableFields, append: appendDeliverable, remove: removeDeliverable } = useFieldArray({
    control,
    name: "deliverables",
  });

  // Fetch milestones and deliverables when dialog opens
  useEffect(() => {
    if (isOpen && project?.id) {
      const fetchRelatedData = async () => {
        try {
          const [milestonesRes, deliverablesRes] = await Promise.all([
            supabase.from("milestones").select("*").eq("project_id", project.id),
            supabase.from("deliverables").select("*").eq("project_id", project.id),
          ]);

          if (milestonesRes.error || deliverablesRes.error) {
            throw new Error("Failed to fetch related data");
          }

          setValue("milestones", milestonesRes.data || []);
          setValue("deliverables", deliverablesRes.data || []);
        } catch (error) {
          toast.error("Failed to load milestones or deliverables");
        }
      };

      fetchRelatedData();
    }
  }, [isOpen, project, setValue]);

  // Handle form submission
  const handleProjectEditSubmit = async (data: z.infer<typeof projectSchema>) => {
    setIsSubmitting(true);
    try {
      // Update project
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          title: data.title,
          description: data.description,
          location: formatLocation(data.location),
          start_date: data.start_date,
          end_date: data.end_date,
          category: data.category,
        })
        .eq("id", project?.id)
        .eq("organization_id", project?.organization_id);

      if (projectError) throw new Error(`Failed to update project: ${projectError.message}`);

      // Update or insert milestones
      if (data.milestones) {
        for (const milestone of data.milestones) {
          if (milestone.id) {
            // Update existing
            const { error } = await supabase
              .from("milestones")
              .update({
                title: milestone.title,
                description: milestone.description,
                due_date: milestone.due_date,
                status: milestone.status,
              })
              .eq("id", milestone.id)
              .eq("project_id", project?.id);
            if (error) throw new Error(`Failed to update milestone: ${error.message}`);
          } else {
            // Insert new
            const { error } = await supabase
              .from("milestones")
              .insert({
                project_id: project?.id,
                title: milestone.title,
                description: milestone.description,
                due_date: milestone.due_date,
                status: milestone.status,
              });
            if (error) throw new Error(`Failed to create milestone: ${error.message}`);
          }
        }
      }

      // Update or insert deliverables
      if (data.deliverables) {
        for (const deliverable of data.deliverables) {
          if (deliverable.id) {
            // Update existing
            const { error } = await supabase
              .from("deliverables")
              .update({
                title: deliverable.title,
                description: deliverable.description,
                status: deliverable.status,
              })
              .eq("id", deliverable.id)
              .eq("project_id", project?.id);
            if (error) throw new Error(`Failed to update deliverable: ${error.message}`);
          } else {
            // Insert new
            const { error } = await supabase
              .from("deliverables")
              .insert({
                project_id: project?.id,
                title: deliverable.title,
                description: deliverable.description,
                status: deliverable.status,
              });
            if (error) throw new Error(`Failed to create deliverable: ${error.message}`);
          }
        }
      }

      toast.success("Project, milestones, and deliverables updated successfully!");
      setIsOpen(false);
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel with confirmation
  const handleCancel = () => {
    if (isDirty) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        setIsOpen(false);
        reset();
      }
    } else {
      setIsOpen(false);
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl sm:max-w-lg p-6 max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
          <DialogDescription id="dialog-description">
            Update project details, milestones, and deliverables below. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleProjectEditSubmit)} className="space-y-6">
          <div className="grid gap-4">
            {/* Project Fields */}
            <div>
              <Label htmlFor="project-title" className={errors.title ? "text-red-600" : ""}>
                Title *
              </Label>
              <Input
                id="project-title"
                {...register("title")}
                aria-describedby="dialog-description"
                aria-invalid={!!errors.title}
                className={errors.title ? "border-red-600" : ""}
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="project-description" className={errors.description ? "text-red-600" : ""}>
                Description *
              </Label>
              <Textarea
                id="project-description"
                {...register("description")}
                aria-describedby="dialog-description"
                aria-invalid={!!errors.description}
                className={errors.description ? "border-red-600" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="project-location" className={errors.location ? "text-red-600" : ""}>
                Location *
              </Label>
              <Input
                id="project-location"
                {...register("location")}
                aria-describedby="dialog-description"
                aria-invalid={!!errors.location}
                className={errors.location ? "border-red-600" : ""}
              />
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="project-start-date" className={errors.start_date ? "text-red-600" : ""}>
                Start Date *
              </Label>
              <Input
                id="project-start-date"
                type="date"
                {...register("start_date")}
                aria-describedby="dialog-description"
                aria-invalid={!!errors.start_date}
                className={errors.start_date ? "border-red-600" : ""}
              />
              {errors.start_date && (
                <p className="text-sm text-red-600 mt-1">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="project-end-date" className={errors.end_date ? "text-red-600" : ""}>
                End Date *
              </Label>
              <Input
                id="project-end-date"
                type="date"
                {...register("end_date")}
                aria-describedby="dialog-description"
                aria-invalid={!!errors.end_date}
                className={errors.end_date ? "border-red-600" : ""}
              />
              {errors.end_date && (
                <p className="text-sm text-red-600 mt-1">{errors.end_date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="project-category" className={errors.category ? "text-red-600" : ""}>
                Category *
              </Label>
              <Select
                onValueChange={(value) => setValue("category", value, { shouldValidate: true })}
                defaultValue={project?.category}
              >
                <SelectTrigger
                  id="project-category"
                  aria-describedby="dialog-description"
                  aria-invalid={!!errors.category}
                  className={errors.category ? "border-red-600" : ""}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Milestones Section */}
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="milestones">
              <AccordionTrigger>Milestones</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {milestoneFields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-md">
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor={`milestones.${index}.title`} className={errors.milestones?.[index]?.title ? "text-red-600" : ""}>
                            Milestone Title *
                          </Label>
                          <Input
                            id={`milestones.${index}.title`}
                            {...register(`milestones.${index}.title`)}
                            aria-invalid={!!errors.milestones?.[index]?.title}
                            className={errors.milestones?.[index]?.title ? "border-red-600" : ""}
                          />
                          {errors.milestones?.[index]?.title && (
                            <p className="text-sm text-red-600 mt-1">{errors.milestones[index].title.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`milestones.${index}.description`}>Description</Label>
                          <Textarea
                            id={`milestones.${index}.description`}
                            {...register(`milestones.${index}.description`)}
                            aria-invalid={!!errors.milestones?.[index]?.description}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`milestones.${index}.due_date`} className={errors.milestones?.[index]?.due_date ? "text-red-600" : ""}>
                            Due Date *
                          </Label>
                          <Input
                            id={`milestones.${index}.due_date`}
                            type="date"
                            {...register(`milestones.${index}.due_date`)}
                            aria-invalid={!!errors.milestones?.[index]?.due_date}
                            className={errors.milestones?.[index]?.due_date ? "border-red-600" : ""}
                          />
                          {errors.milestones?.[index]?.due_date && (
                            <p className="text-sm text-red-600 mt-1">{errors.milestones[index].due_date.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`milestones.${index}.status`} className={errors.milestones?.[index]?.status ? "text-red-600" : ""}>
                            Status *
                          </Label>
                          <Select
                            onValueChange={(value) => setValue(`milestones.${index}.status`, value, { shouldValidate: true })}
                            defaultValue={field.status}
                          >
                            <SelectTrigger
                              id={`milestones.${index}.status`}
                              aria-invalid={!!errors.milestones?.[index]?.status}
                              className={errors.milestones?.[index]?.status ? "border-red-600" : ""}
                            >
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
                            <p className="text-sm text-red-600 mt-1">{errors.milestones[index].status.message}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                          aria-label={`Remove milestone ${index + 1}`}
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendMilestone({ title: "", description: "", due_date: "", status: "Pending" })}
                    aria-label="Add new milestone"
                    className="mt-2"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Milestone
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Deliverables Section */}
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="deliverables">
              <AccordionTrigger>Deliverables</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {deliverableFields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-md">
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor={`deliverables.${index}.title`} className={errors.deliverables?.[index]?.title ? "text-red-600" : ""}>
                            Deliverable Title *
                          </Label>
                          <Input
                            id={`deliverables.${index}.title`}
                            {...register(`deliverables.${index}.title`)}
                            aria-invalid={!!errors.deliverables?.[index]?.title}
                            className={errors.deliverables?.[index]?.title ? "border-red-600" : ""}
                          />
                          {errors.deliverables?.[index]?.title && (
                            <p className="text-sm text-red-600 mt-1">{errors.deliverables[index].title.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`deliverables.${index}.description`}>Description</Label>
                          <Textarea
                            id={`deliverables.${index}.description`}
                            {...register(`deliverables.${index}.description`)}
                            aria-invalid={!!errors.deliverables?.[index]?.description}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`deliverables.${index}.status`} className={errors.deliverables?.[index]?.status ? "text-red-600" : ""}>
                            Status *
                          </Label>
                          <Select
                            onValueChange={(value) => setValue(`deliverables.${index}.status`, value, { shouldValidate: true })}
                            defaultValue={field.status}
                          >
                            <SelectTrigger
                              id={`deliverables.${index}.status`}
                              aria-invalid={!!errors.deliverables?.[index]?.status}
                              className={errors.deliverables?.[index]?.status ? "border-red-600" : ""}
                            >
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
                            <p className="text-sm text-red-600 mt-1">{errors.deliverables[index].status.message}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDeliverable(index)}
                          aria-label={`Remove deliverable ${index + 1}`}
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendDeliverable({ title: "", description: "", status: "Pending" })}
                    aria-label="Add new deliverable"
                    className="mt-2"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Deliverable
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialogue;