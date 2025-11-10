"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSendMail } from "@/services/mail";
import ProjectsList from "./project-list";

const supabase = createClient();

interface AgencyProfile {
  id: string;
  organization_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  website: string | null;
  focus_areas: string[] | null;
  address: string | null;
  organization_type: string | null;
  description: string | null;
  environment_cities: string[] | null;
  environment_states: string[] | null;
  profile_picture: string | null;
  is_active: boolean;
}

const profileSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required"),
  contact_person_email: z.string().email("Invalid email").or(z.literal("")),
  contact_person_phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  organization_type: z.string().optional(),
  description: z.string().optional(),
  focus_areas: z.string().optional(),
  environment_cities: z.string().optional(),
  environment_states: z.string().optional(),
  is_active: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const AgencyProfile = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [pendingDeactivation, setPendingDeactivation] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { is_active: true },
  });

  const currentActiveStatus = watch("is_active");

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("role", "agency")
      .single();

    if (error || !data) {
      toast.error("Failed to load agency profile");
      setLoading(false);
      return;
    }

    const profileData: AgencyProfile = {
      ...data,
      focus_areas: data.focus_areas || [],
      environment_cities: data.environment_cities || [],
      environment_states: data.environment_states || [],
    };

    setProfile(profileData);
    reset({
      organization_name: profileData.organization_name || "",
      contact_person_email: profileData.contact_person_email || "",
      contact_person_phone: profileData.contact_person_phone || "",
      website: profileData.website || "",
      address: profileData.address || "",
      organization_type: profileData.organization_type || "",
      description: profileData.description || "",
      focus_areas: profileData.focus_areas?.join(", ") || "",
      environment_cities: profileData.environment_cities?.join(", ") || "",
      environment_states: profileData.environment_states?.join(", ") || "",
      is_active: profileData.is_active ?? true,
    });
    setPreviewUrl(profileData.profile_picture || null);
    setLoading(false);
  }, [id, reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setImageUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${id}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `agency-avatars/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      toast.success("Profile picture updated");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  // Save handler
  const saveProfile = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const updatedData = {
        ...data,
        focus_areas: data.focus_areas
          ? data.focus_areas.split(",").map(s => s.trim()).filter(Boolean)
          : null,
        environment_cities: data.environment_cities
          ? data.environment_cities.split(",").map(s => s.trim()).filter(Boolean)
          : null,
        environment_states: data.environment_states
          ? data.environment_states.split(",").map(s => s.trim()).filter(Boolean)
          : null,
        profile_picture: previewUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("id", id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      setIsModalOpen(false);
      toast.success("Profile updated successfully");

      // Send email on status change
      if (profile?.is_active !== data.is_active && data.contact_person_email) {
        const status = data.is_active ? "activated" : "deactivated";
        await useSendMail({
          to: data.contact_person_email,
          subject: `Your Agency Has Been ${data.is_active ? "Activated" : "Deactivated"}`,
          html: `<p>Your agency <strong>${data.organization_name}</strong> is now <strong>${status}</strong>.</p>`,
          onSuccess: () => toast.success("Status email sent"),
          onError: () => toast.error("Profile saved, but email failed"),
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
      setPendingDeactivation(false);
    }
  };

  // Submit: only show dialog if deactivating
  const onSubmit = async (data: ProfileFormData) => {
    if (!data.is_active && profile?.is_active) {
      setPendingDeactivation(true);
      setShowDeactivateDialog(true);
      return;
    }
    await saveProfile(data);
  };

  // Switch handler
  const handleStatusChange = (checked: boolean) => {
    setValue("is_active", checked);
  };

  // Modal close cleanup
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setPendingDeactivation(false);
    }
    setIsModalOpen(open);
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <ErrorState message="Agency not found" />;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.profile_picture || ""} />
                  <AvatarFallback className="text-2xl">
                    {profile.organization_name?.[0] || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{profile.organization_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Agency Profile</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`font-medium ${
                    profile.is_active
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-red-100 text-red-800 border-red-300"
                  }`}
                >
                  {profile.is_active ? "Active" : "Inactive"}
                </Badge>
                <Button onClick={() => setIsModalOpen(true)} className="action-btn">Edit Profile</Button>
              </div>
            </CardHeader>

            <CardContent className="grid md:grid-cols-2 gap-8">
              <InfoSection title="Contact" data={{
                Email: profile.contact_person_email,
                Phone: profile.contact_person_phone,
                Website: profile.website,
                Type: profile.organization_type,
                Address: profile.address,
              }} />
              <InfoSection title="Operations" data={{
                "Focus Areas": profile.focus_areas?.join(", "),
                Cities: profile.environment_cities?.join(", "),
                States: profile.environment_states?.join(", "),
                Description: profile.description,
              }} />
            </CardContent>

            <div className="px-6 pb-6">
              <Button variant="outline" onClick={() => router.back()}>
                Back to List
              </Button>
            </div>
          </Card>

          <ProjectsList agencyId={id} />
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        profile={profile}
        register={register}
        control={control}
        errors={errors}
        isSubmitting={saving || isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
        previewUrl={previewUrl}
        imageUploading={imageUploading}
        handleImageUpload={handleImageUpload}
        currentActiveStatus={currentActiveStatus}
        handleStatusChange={handleStatusChange}
      />

      {/* Deactivate Confirmation */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Deactivate Agency?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This agency will no longer be able to create projects or receive applications.
              You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setValue("is_active", true);
              setPendingDeactivation(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowDeactivateDialog(false);
                const data = watch();
                await saveProfile(data);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ——— Helper Components (unchanged) ———
const ProfileSkeleton = () => (
  <div className="container mx-auto p-6 max-w-5xl">
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="container mx-auto p-6">
    <Alert variant="destructive" className="max-w-lg mx-auto">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  </div>
);

const InfoSection = ({ title, data }: { title: string; data: Record<string, string | null | undefined> }) => (
  <div className="space-y-3">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <dl className="space-y-2 text-sm">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex justify-between">
          <dt className="font-medium text-gray-600">{key}:</dt>
          <dd className="text-gray-900 ml-4">
            {value ? (
              key === "Website" ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {value}
                </a>
              ) : value
            ) : "—"}
          </dd>
        </div>
      ))}
    </dl>
  </div>
);

interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AgencyProfile;
  register: any;
  control: any;
  errors: any;
  isSubmitting: boolean;
  onSubmit: () => void;
  previewUrl: string | null;
  imageUploading: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentActiveStatus: boolean;
  handleStatusChange: (checked: boolean) => void;
}

const EditModal: React.FC<EditModalProps> = ({
  open, onOpenChange, register, control, errors, isSubmitting, onSubmit,
  profile, previewUrl, imageUploading, handleImageUpload, currentActiveStatus, handleStatusChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agency Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={previewUrl || ""} />
              <AvatarFallback>{profile.organization_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="picture" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>Change Photo</span>
                </div>
                <Input id="picture" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </Label>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Organization Name *</Label>
              <Input {...register("organization_name")} />
              {errors.organization_name && <p className="text-sm text-red-600 mt-1">{errors.organization_name.message}</p>}
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input type="email" {...register("contact_person_email")} />
              {errors.contact_person_email && <p className="text-sm text-red-600 mt-1">{errors.contact_person_email.message}</p>}
            </div>
            <div><Label>Phone</Label><Input {...register("contact_person_phone")} /></div>
            <div><Label>Website</Label><Input {...register("website")} /></div>
            <div><Label>Address</Label><Input {...register("address")} /></div>
            <div><Label>Type</Label><Input {...register("organization_type")} /></div>
            <div className="md:col-span-2"><Label>Description</Label><Textarea {...register("description")} rows={3} /></div>
            <div><Label>Focus Areas</Label><Input {...register("focus_areas")} placeholder="Education, Health" /></div>
            <div><Label>Cities</Label><Input {...register("environment_cities")} placeholder="Lagos, Abuja" /></div>
            <div><Label>States</Label><Input {...register("environment_states")} placeholder="Lagos State" /></div>

            <div className="flex items-center justify-between md:col-span-2">
              <Label htmlFor="is_active" className="cursor-pointer">Account Status</Label>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={handleStatusChange}
                    className={field.value ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-red-600"}
                  />
                )}
              />
              <Badge variant="outline" className={`font-medium ml-2 ${currentActiveStatus ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}`}>
                {currentActiveStatus ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="action-btn">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgencyProfile;