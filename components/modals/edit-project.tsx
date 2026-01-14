"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Edit, Loader2 } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Project } from "@/lib/types";
import { CheckboxReactHookFormMultiple } from "../renderedItems";
import { expertiseData } from "@/data/expertise";

// Form schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description is too short"),
  required_skills: z.array(z.string()).min(1, "At least one skill is required"),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  volunteers_needed: z.number().min(1, "At least 1 volunteer needed"),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditProjectModalProps {
  project: Project;
  projectManagerId: string;
  onSuccess?: () => void;
}

export function EditProjectModal({
  project,
  projectManagerId,
  onSuccess,
}: EditProjectModalProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project.title || "",
      description: project.description || "",
      required_skills: project.required_skills || [],
      start_date: project.start_date ? new Date(project.start_date) : undefined,
      end_date: project.end_date ? new Date(project.end_date) : undefined,
      volunteers_needed: project.volunteers_needed || 10,
      category: project.category || "",
    },
  });

  // Fetch profile when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);
      }
    };

    fetchProfile();
  }, [open, supabase]);

  const onSubmit = async (values: FormValues) => {
    if (projectManagerId !== project.project_manager_id) {
      toast.error("Only the project manager can edit this project");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          title: values.title,
          description: values.description,
          required_skills: values.required_skills,
          start_date: values.start_date
            ? format(values.start_date, "yyyy-MM-dd")
            : null,
          end_date: values.end_date
            ? format(values.end_date, "yyyy-MM-dd")
            : null,
          volunteers_needed: values.volunteers_needed,
          category: values.category || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Project updated successfully!");
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to update project");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-diaspora-blue text-diaspora-blue">
          <Edit />
          Edit overview
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[680px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-2xl font-bold text-diaspora-darkBlue">
            Edit Project Details
          </DialogTitle>
        </DialogHeader>

        {profile && (
          <div className="px-6 pt-4 pb-2 bg-muted/30 text-sm">
            <p className="font-medium">Editing as: {profile.full_name}</p>
            <p className="text-muted-foreground">
              Role: {profile.role || "N/A"} • Email: {profile.email}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the project goals, impact, and tasks..."
                        className="min-h-[160px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Required Skills */}
              <FormField
                control={form.control}
                name="required_skills"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      {/* Wrapped in a stable container to prevent layout thrashing */}
                      <div className="border border-input rounded-lg p-4 bg-background">
                        <CheckboxReactHookFormMultiple
                          items={expertiseData}
                          onChange={(selected) => field.onChange(selected)}
                          initialValues={field.value || []}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Range */}
              <FormItem className="space-y-3">
                <FormLabel>Project Timeline</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("start_date") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("start_date") && form.watch("end_date")
                        ? `${format(
                            form.watch("start_date")!,
                            "PPP"
                          )} – ${format(form.watch("end_date")!, "PPP")}`
                        : "Select date range"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DayPicker
                      mode="range"
                      selected={{
                        from: form.watch("start_date"),
                        to: form.watch("end_date"),
                      }}
                      onSelect={(range) => {
                        if (range?.from)
                          form.setValue("start_date", range.from);
                        if (range?.to) form.setValue("end_date", range.to);
                      }}
                      numberOfMonths={2}
                      disabled={{ before: new Date() }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>

              {/* Volunteers Needed */}
              <FormField
                control={form.control}
                name="volunteers_needed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volunteers Needed</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Information Technology">
                          Information Technology
                        </SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Environment">Environment</SelectItem>
                        <SelectItem value="Legal & Law Services">
                          Legal & Law Services
                        </SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-8 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="action-btn">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
