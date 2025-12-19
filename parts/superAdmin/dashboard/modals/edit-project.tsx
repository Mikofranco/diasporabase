"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Project } from "@/lib/types";
import { title } from "process";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "pending", "cancelled"]),
  category: z.string().min(1, "Category is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  location: z.string().optional(),
  contact_person_first_name: z.string().min(1, "First name required"),
  contact_person_last_name: z.string().min(1, "Last name required"),
  contact_person_email: z.string().email("Invalid email"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface EditProjectModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditProjectModal({ project, open, onOpenChange, onSuccess }: EditProjectModalProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description || "",
        status: project.status,
        category: project.category,//@ts-ignore
        start_date: project.start_date,//@ts-ignore
        end_date: project.end_date || "",//@ts-ignore
        location: project.location || "",//@ts-ignore
        contact_person_first_name: project.contact_person_first_name,//@ts-ignore
        contact_person_last_name: project.contact_person_last_name,//@ts-ignore
        contact_person_email: project.contact_person_email,
      });
    }
  }, [project, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    if (!project?.id) return;

    setSaving(true);

    const payload = { 
      title: data.title,
      description: data.description,
      status: data.status,
      category: data.category,
      start_date: data.start_date,
      end_date: data.end_date,
      location: data.location,
     };
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Project updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project Title *</Label>
              <Input {...register("title")} />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label>Status *</Label>
              <Select onValueChange={(v) => setValue("status", v as any)} defaultValue={project.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category *</Label>
              <Input {...register("category")} />
              {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <Label>Location</Label>
              <Input {...register("location")} />
            </div>

            <div>
              <Label>Target Start Date *</Label>
              <Input type="date" {...register("start_date")} />
              {errors.start_date && <p className="text-sm text-red-600 mt-1">{errors.start_date.message}</p>}
            </div>

            <div>
              <Label>Target End Date</Label>
              <Input type="date" {...register("end_date")} />
            </div>

            <div>
              <Label>First Name *</Label>
              <Input {...register("contact_person_first_name")} />
              {errors.contact_person_first_name && (
                <p className="text-sm text-red-600 mt-1">{errors.contact_person_first_name.message}</p>
              )}
            </div>

            <div>
              <Label>Last Name *</Label>
              <Input {...register("contact_person_last_name")} />
              {errors.contact_person_last_name && (
                <p className="text-sm text-red-600 mt-1">{errors.contact_person_last_name.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label>Email *</Label>
              <Input type="email" {...register("contact_person_email")} />
              {errors.contact_person_email && (
                <p className="text-sm text-red-600 mt-1">{errors.contact_person_email.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea {...register("description")} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
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
}