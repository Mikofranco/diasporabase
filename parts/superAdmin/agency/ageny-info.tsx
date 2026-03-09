"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Upload, AlertTriangle, FileCheck } from "lucide-react";
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
import { formatLocation } from "@/lib/utils";
import DocumentViewer from "@/components/document-viewer";
import OverviewSection from "./overview";
import type { AgencyProfile } from "@/lib/types";
import { routes } from "@/lib/routes";

const supabase = createClient();



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
  documents: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const AgencyProfile = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isSuperAdmin = pathname.includes("super-admin");
  const agenciesListHref = isSuperAdmin ? routes.superAdminAgencies : routes.adminAgencies;
  const getProjectViewUrl = (projectId: string) => {
    const base = isSuperAdmin ? routes.superAdminViewProject(projectId) : routes.adminViewProject(projectId);
    return `${base}?from_agency=${id}`;
  };

  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [pendingDeactivation, setPendingDeactivation] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAdminDeactivateConfirm, setShowAdminDeactivateConfirm] = useState(false);

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setCurrentUserRole(currentProfile?.role ?? null);
    }

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
    console.log("Fetched Profile Data:", data);

    const profileData: AgencyProfile = {
      ...data,
      focus_areas: Array.isArray(data.focus_areas) ? data.focus_areas : [],
      environment_cities: Array.isArray(data.environment_cities) ? data.environment_cities : [],
      environment_states: Array.isArray(data.environment_states) ? data.environment_states : [],
      documents: Array.isArray(data.documents) ? data.documents : [],
    };

    setProfile(profileData);
    const focusAreas = Array.isArray(profileData.focus_areas) ? profileData.focus_areas : [];
    reset({
      organization_name: profileData.organization_name || "",
      contact_person_email: profileData.contact_person_email || "",
      contact_person_phone: profileData.contact_person_phone || "",
      website: profileData.website || "",
      address: profileData.address || "",
      organization_type: profileData.organization_type || "",
      description: profileData.description || "",
      focus_areas: focusAreas.join(", "),
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
    const fileName = `${id}-${Math.random()
      .toString(36)
      .substr(2, 9)}.${fileExt}`;
    const filePath = `agency-avatars/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

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
          ? data.focus_areas
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        environment_cities: data.environment_cities
          ? data.environment_cities
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        environment_states: data.environment_states
          ? data.environment_states
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        profile_picture: previewUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("id", id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
      setIsModalOpen(false);
      toast.success("Profile updated successfully");

      // Send email on status change
      if (profile?.is_active !== data.is_active && data.contact_person_email) {
        const status = data.is_active ? "activated" : "deactivated";
        await useSendMail({
          to: data.contact_person_email,
          subject: `Your Agency Has Been ${
            data.is_active ? "Activated" : "Deactivated"
          }`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Agency Status Update</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    .container { max-width: 600px; margin: 32px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 32px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 12px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 32px; color: #1e293b; text-align: center; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 18px;
      text-transform: capitalize;
      margin: 24px 0;
    }
    .status-approved { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .status-pending { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .status-rejected { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
    .agency-name { font-size: 22px; font-weight: 700; color: #1e40af; margin: 16px 0; }
    .message { font-size: 16px; line-height: 1.7; color: #475569; margin: 20px 0; }
    .btn {
      display: inline-block;
      background: #1e40af;
      color: white;
      font-weight: 600;
      font-size: 16px;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      margin: 28px 0;
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
      transition: all 0.2s;
    }
    .btn:hover { background: #1e3a8a; transform: translateY(-1px); }
    .footer { background: #f1f5f9; padding: 32px; text-align: center; font-size: 14px; color: #64748b; }
    .footer a { color: #1e40af; text-decoration: none; font-weight: 500; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a; }
      .container { background: #1e293b; color: #e2e8f0; }
      .content { color: #cbd5e1; }
      .message { color: #94a3b8; }
      .footer { background: #1e293b; color: #94a3b8; }
    }
    @media (max-width: 480px) {
      .container { margin: 16px; border-radius: 12px; }
      .header { padding: 32px 24px; }
      .content { padding: 32px 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>DiasporaBase</h1>
      <p>Agency Account Update</p>
    </div>

    <!-- Main Content -->
    <div class="content">
      <p class="message">Hello,</p>
      <p class="message">Great news! Your agency registration has been processed.</p>

      <div class="agency-name">
        ${data.organization_name}
      </div>

      <div class="status-badge status-${status}">
        ${
          status === "activated"
            ? "Checkmark Approved"
            : status === "deactivated"
              ? "Cross Rejected"
              : "Clock Pending Review"
        }
        <strong>${status.charAt(0).toUpperCase() + status.slice(1)}</strong>
      </div>

      ${
        status === "activated"
          ? `
        <p class="message">
          Congratulations! Your agency is now <strong>verified</strong> and can start posting projects.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}${routes.agencyDashboard}" class="btn">
          Go to Dashboard
        </a>
      `
          : status === "deactivated"
            ? `
        <p class="message">
          Your application is under review. We'll notify you within 48 hours.
        </p>
      `
            : `
        <p class="message">
          Unfortunately, your application was not approved at this time.<br/>
          Please contact <a href="mailto:support@diasporabase.com">support</a> for more details.
        </p>
      `
      }
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
      <p>
        Questions? <a href="mailto:support@diasporabase.com">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>
`,
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

  const handleActivateDeactivate = async (activate: boolean) => {
    if (!id || !profile) return;
    if (!activate) {
      setShowAdminDeactivateConfirm(true);
      return;
    }
    await updateAgencyStatus(activate);
  };

  const updateAgencyStatus = async (isActive: boolean) => {
    if (!id) return;
    setShowAdminDeactivateConfirm(false);
    setTogglingStatus(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, is_active: isActive } : null));
      toast.success(isActive ? "Agency activated" : "Agency deactivated");

      if (profile?.contact_person_email && !isActive) {
        await useSendMail({
          to: profile.contact_person_email,
          subject: "Your Agency Has Been Deactivated",
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Agency Status</title></head>
<body style="font-family:system-ui;max-width:600px;margin:0 auto;padding:24px;">
  <p>Hello,</p>
  <p>Your agency <strong>${profile.organization_name || "account"}</strong> has been deactivated. You will not be able to create or manage projects until the account is reactivated.</p>
  <p>Contact support if you have questions.</p>
  <p>&copy; ${new Date().getFullYear()} DiasporaBase.</p>
</body>
</html>`,
          onSuccess: () => {},
          onError: () => {},
        });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <ErrorState message="Agency not found" />;

  const focusAreasList = Array.isArray(profile.focus_areas) ? profile.focus_areas : [];
  const envCities = Array.isArray(profile.environment_cities) ? profile.environment_cities : [];
  const envStates = Array.isArray(profile.environment_states) ? profile.environment_states : [];
  const documentsList = (profile.documents ?? []).map((doc: string, index: number) => ({
    url: doc,
    name: `Document ${index + 1}`,
  }));

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={agenciesListHref}>Agencies</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                  {profile.organization_name || "Agency"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {profile.contact_person_email == null || profile.contact_person_email === "" ? (
            <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Incomplete Profile</AlertTitle>
              <AlertDescription>
                This agency has not completed onboarding. Ask them to provide contact email and required information.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Hero / Header block */}
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-20 w-20 border-2 border-gray-100 shrink-0">
                  <AvatarImage src={profile.profile_picture || ""} alt="" />
                  <AvatarFallback className="text-2xl bg-diaspora-blue/10 text-diaspora-blue">
                    {(profile.organization_name || "A").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="text-2xl text-gray-900 truncate">
                    {profile.organization_name || "—"}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-muted-foreground">Agency profile</span>
                    <Badge
                      variant="outline"
                      className={`font-medium shrink-0 ${
                        profile.is_active
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      }`}
                    >
                      {profile.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {profile.is_active ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleActivateDeactivate(false)}
                    disabled={togglingStatus}
                  >
                    {togglingStatus ? "Updating…" : "Deactivate"}
                  </Button>
                ) : (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => updateAgencyStatus(true)}
                    disabled={togglingStatus}
                  >
                    {togglingStatus ? "Updating…" : "Activate"}
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Section: Overview */}
          <SectionBlock title="Overview">
            <OverviewSection profile={profile} />
          </SectionBlock>

          {/* Section: Contact person information */}
          <SectionBlock title="Contact person information">
            <InfoSection
              title=""
              data={{
                "Name": [profile.contact_person_first_name, profile.contact_person_last_name]
                  .filter(Boolean)
                  .join(" ") || undefined,
                "Email": profile.contact_person_email ?? undefined,
                "Phone": profile.contact_person_phone ?? undefined,
              }}
            />
          </SectionBlock>

          {/* Section: Focus & operations */}
          {(focusAreasList.length > 0 || envCities.length > 0 || envStates.length > 0 || profile.description) && (
            <SectionBlock title="Focus & operations">
              <Card className="border shadow-sm">
                <CardContent className="pt-6">
                  <dl className="space-y-4 text-sm">
                    {profile.description && (
                      <div>
                        <dt className="font-medium text-gray-600 mb-1">Description</dt>
                        <dd className="text-gray-900">{profile.description}</dd>
                      </div>
                    )}
                    {focusAreasList.length > 0 && (
                      <div>
                        <dt className="font-medium text-gray-600 mb-1">Focus areas</dt>
                        <dd className="text-gray-900">{focusAreasList.join(", ")}</dd>
                      </div>
                    )}
                    {envCities.length > 0 && (
                      <div>
                        <dt className="font-medium text-gray-600 mb-1">Cities</dt>
                        <dd className="text-gray-900">{envCities.join(", ")}</dd>
                      </div>
                    )}
                    {envStates.length > 0 && (
                      <div>
                        <dt className="font-medium text-gray-600 mb-1">States</dt>
                        <dd className="text-gray-900">{envStates.join(", ")}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </SectionBlock>
          )}

          {/* Section: Documents */}
          {documentsList.length > 0 && (
            <SectionBlock title="Documents">
              <DocumentViewer documents={documentsList} />
            </SectionBlock>
          )}

          {/* Section: Projects */}
          <SectionBlock title="Projects">
            <ProjectsList agencyId={id!} getProjectViewUrl={getProjectViewUrl} />
          </SectionBlock>
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

      {/* Deactivate Confirmation (Edit modal flow) */}
      <AlertDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Deactivate Agency?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This agency will no longer be able to create projects or receive
              applications. You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setValue("is_active", true);
                setPendingDeactivation(false);
              }}
            >
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

      {/* Admin: Deactivate confirmation */}
      <AlertDialog
        open={showAdminDeactivateConfirm}
        onOpenChange={setShowAdminDeactivateConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Deactivate agency?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This agency will no longer be able to create or manage projects until you activate them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => updateAgencyStatus(false)}
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

// ——— Helper Components ———
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50 py-6">
    <div className="container mx-auto px-4 max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-3 w-3 rounded-full shrink-0" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      {/* Hero card */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-8 w-56" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-md shrink-0" />
        </CardHeader>
      </Card>

      {/* Section: Overview */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded shrink-0" />
                  <Skeleton className="h-4 flex-1 min-w-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section: Contact */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-4 w-24 shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section: Focus / content block */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Card className="border shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>

      {/* Section: Projects */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-2 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
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

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

const InfoSection = ({
  title,
  data,
}: {
  title: string;
  data: Record<string, string | null | undefined>;
}) => (
  <Card className="border shadow-sm">
    <CardContent className="pt-6">
      {title ? (
        <h3 className="text-base font-semibold text-diaspora-darkBlue mb-4">{title}</h3>
      ) : null}
      <dl className="space-y-3 text-sm">
        {Object.entries(data)
          .filter(([, value]) => value != null && value !== "")
          .map(([key, value]) => (
            <div key={key} className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-gray-600 shrink-0">{key}:</dt>
              <dd className="text-gray-900">
                {value ? (
                  key === "Website" ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-diaspora-blue hover:underline"
                    >
                      {value}
                    </a>
                  ) : (
                    value
                  )
                ) : (
                  "—"
                )}
              </dd>
            </div>
          ))}
      </dl>
    </CardContent>
  </Card>
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
  open,
  onOpenChange,
  register,
  control,
  errors,
  isSubmitting,
  onSubmit,
  profile,
  previewUrl,
  imageUploading,
  handleImageUpload,
  currentActiveStatus,
  handleStatusChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agency Profile</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-5"
        >
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={previewUrl || ""} />
              <AvatarFallback>{profile.organization_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="picture" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  {imageUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Change Photo</span>
                </div>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG up to 2MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Organization Name *</Label>
              <Input {...register("organization_name")} />
              {errors.organization_name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.organization_name.message}
                </p>
              )}
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input type="email" {...register("contact_person_email")} />
              {errors.contact_person_email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.contact_person_email.message}
                </p>
              )}
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register("contact_person_phone")} />
            </div>
            <div>
              <Label>Website</Label>
              <Input {...register("website")} />
            </div>
            <div>
              <Label>Address</Label>
              <Input {...register("address")} />
            </div>
            <div>
              <Label>Type</Label>
              <Input {...register("organization_type")} />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea {...register("description")} rows={3} />
            </div>
            <div>
              <Label>Focus Areas</Label>
              <Input
                {...register("focus_areas")}
                placeholder="Education, Health"
              />
            </div>
            <div>
              <Label>Cities</Label>
              <Input
                {...register("environment_cities")}
                placeholder="Lagos, Abuja"
              />
            </div>
            <div>
              <Label>States</Label>
              <Input
                {...register("environment_states")}
                placeholder="Lagos State"
              />
            </div>

            <div className="flex items-center justify-between md:col-span-2">
              <Label htmlFor="is_active" className="cursor-pointer">
                Account Status
              </Label>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={handleStatusChange}
                    className={
                      field.value
                        ? "data-[state=checked]:bg-green-600"
                        : "data-[state=unchecked]:bg-red-600"
                    }
                  />
                )}
              />
              <Badge
                variant="outline"
                className={`font-medium ml-2 ${
                  currentActiveStatus
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-red-100 text-red-800 border-red-300"
                }`}
              >
                {currentActiveStatus ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="action-btn"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgencyProfile;
