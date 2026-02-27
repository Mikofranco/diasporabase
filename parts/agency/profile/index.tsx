// app/dashboard/agency/profile/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Edit2, MapPin, User, Globe, Phone, Mail, Building, Loader2 } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";

const supabase = createClient();

// Form validation schema
const formSchema = z.object({
  full_name: z.string().min(1, "Organization name is required.").trim(),
  description: z.string().max(500, "Description cannot exceed 500 characters.").nullable(),
  address: z.string().min(1, "Address is required.").trim(),
  organization_name: z.string().min(1, "Organization name is required.").trim(),
  contact_person_first_name: z.string().min(1, "First name is required.").trim(),
  contact_person_last_name: z.string().min(1, "Last name is required.").trim(),
  contact_person_email: z.string().email("Invalid email address.").min(1, "Email is required."),
  contact_person_phone: z.string().min(1, "Phone number is required.").trim(),
  website: z.string().nullable(),
  organization_type: z.string().min(1, "Organization type is required.").trim(),
  tax_id: z.string().min(1, "Tax ID is required.").trim(),
  focus_areas: z.array(z.string()).min(1, "At least one focus area is required."),
  environment_cities: z.array(z.string()).nullable(),
  environment_states: z.array(z.string()).nullable(),
  profile_picture: z.string().url("Invalid URL.").nullable(),
  organization_phone: z.string().trim().optional(),
});

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  description: string | null;
  address: string | null;
  organization_name: string | null;
  contact_person_first_name: string | null;
  contact_person_last_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  website: string | null;
  organization_type: string | null;
  tax_id: string | null;
  focus_areas: string[] | null;
  environment_cities: string[] | null;
  environment_states: string[] | null;
  profile_picture: string | null;
}

const CONTENT_WIDTH = "max-w-6xl";

function ProfileSkeleton() {
  return (
    <div className={`container mx-auto p-8 space-y-8 ${CONTENT_WIDTH}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <div className="space-y-6">
        <Card className="shadow-md border border-gray-200/80 rounded-xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-56 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="shadow-md border border-gray-200/80 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Organization</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-5 w-full rounded" />
              </div>
            ))}
            <div className="sm:col-span-2 space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border border-gray-200/80 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-5 w-full rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-md border border-gray-200/80 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Location & focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-5 w-full rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-20 rounded-md" />
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-16 rounded-md" />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-24 rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const router = useRouter();

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      description: null,
      address: "",
      organization_name: "",
      contact_person_first_name: "",
      contact_person_last_name: "",
      contact_person_email: "",
      contact_person_phone: "",
      website: null,
      organization_type: "",
      tax_id: "",
      focus_areas: [],
      environment_cities: [],
      environment_states: [],
      profile_picture: null,
      organization_phone: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view your profile.");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            phone,
            role,
            description,
            address,
            organization_name,
            contact_person_first_name,
            contact_person_last_name,
            contact_person_email,
            contact_person_phone,
            website,
            organization_type,
            tax_id,
            focus_areas,
            environment_cities,
            environment_states,
            profile_picture
          `)
          .eq("id", userId)
          .eq("role", "agency")
          .single();

        if (profileError) throw new Error("Error fetching profile: " + profileError.message);
        if (!profileData) throw new Error("Profile not found or you are not an agency.");

        setProfile(profileData);
        form.reset({
          full_name: profileData.full_name || "",
          description: profileData.description || null,
          address: profileData.address || "",
          organization_name: profileData.organization_name || "",
          contact_person_first_name: profileData.contact_person_first_name || "",
          contact_person_last_name: profileData.contact_person_last_name || "",
          contact_person_email: profileData.contact_person_email || "",
          contact_person_phone: profileData.contact_person_phone || "",
          website: profileData.website || null,
          organization_type: profileData.organization_type || "",
          tax_id: profileData.tax_id || "",
          focus_areas: profileData.focus_areas || [],
          environment_cities: profileData.environment_cities || [],
          environment_states: profileData.environment_states || [],
          profile_picture: profileData.profile_picture || null,
          organization_phone: profileData.phone ?? "",
        });
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePictureFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setSaving(true);
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to update your profile.");

      let profilePictureUrl = data.profile_picture;
      if (profilePictureFile) {
        const fileExt = profilePictureFile.name.split(".").pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, profilePictureFile, { upsert: true });

        if (uploadError) throw new Error("Error uploading profile picture: " + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(fileName);
        profilePictureUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          description: data.description,
          address: data.address,
          organization_name: data.organization_name,
          contact_person_first_name: data.contact_person_first_name,
          contact_person_last_name: data.contact_person_last_name,
          contact_person_email: data.contact_person_email,
          contact_person_phone: data.contact_person_phone,
          website: data.website,
          organization_type: data.organization_type,
          tax_id: data.tax_id,
          focus_areas: data.focus_areas,
          environment_cities: data.environment_cities,
          environment_states: data.environment_states,
          profile_picture: profilePictureUrl,
          phone: data.organization_phone || null,
        })
        .eq("id", userId)
        .eq("role", "agency");

      if (updateError) throw new Error("Error updating profile: " + updateError.message);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              id: prev.id,
              email: prev.email,
              phone: data.organization_phone || null,
              role: prev.role,
              full_name: data.full_name,
              description: data.description,
              address: data.address,
              organization_name: data.organization_name,
              contact_person_first_name: data.contact_person_first_name,
              contact_person_last_name: data.contact_person_last_name,
              contact_person_email: data.contact_person_email,
              contact_person_phone: data.contact_person_phone,
              website: data.website,
              organization_type: data.organization_type,
              tax_id: data.tax_id,
              focus_areas: data.focus_areas,
              environment_cities: data.environment_cities,
              environment_states: data.environment_states,
              profile_picture: profilePictureUrl,
            }
          : null
      );
      setIsEditing(false);
      setProfilePictureFile(null);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className={`container mx-auto p-8 ${CONTENT_WIDTH}`}>
        <Card className="border-red-200 bg-red-50 shadow-md rounded-xl">
          <CardContent className="pt-6 text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`container mx-auto p-8 ${CONTENT_WIDTH}`}>
        <Card className="shadow-md rounded-xl">
          <CardContent className="pt-6 text-gray-600">Profile not found.</CardContent>
        </Card>
      </div>
    );
  }

  const sectionCardClass = "shadow-md border border-gray-200/80 rounded-xl overflow-hidden";

  return (
    <TooltipProvider>
      <div className={`container mx-auto p-8 space-y-8 ${CONTENT_WIDTH}`}>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{isEditing ? "Edit Agency Profile" : "Agency Profile"}</h1>
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-4 py-2"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Profile header block */}
          <Card className={sectionCardClass}>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {profile.profile_picture ? (
                  <Image
                    src={profile.profile_picture}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <Building className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <CardTitle className="text-xl text-diaspora-darkBlue font-semibold">
                    {profile.full_name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-0.5">Agency Profile</CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isEditing ? (
            <>
              {/* Organization section */}
              <Card className={sectionCardClass}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-gray-700 font-medium">Organization Name</Label>
                    <p className="text-gray-600">{profile.organization_name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Display Name</Label>
                    <p className="text-gray-600">{profile.full_name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Organization Email
                    </Label>
                    <p className="text-gray-600">{profile.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Organization Phone
                    </Label>
                    <p className="text-gray-600">{profile.phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Organization Type</Label>
                    <p className="text-gray-600">{profile.organization_type || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Tax ID</Label>
                    <p className="text-gray-600">{profile.tax_id || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium flex items-center gap-1">
                      <Globe className="h-4 w-4 text-gray-500" />
                      Website
                    </Label>
                    <p className="text-gray-600">
                      {profile.website ? (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-diaspora-darkBlue hover:underline"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-gray-700 font-medium">Description</Label>
                    <p className="text-gray-600">{profile.description || "No description provided."}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact section */}
              <Card className={sectionCardClass}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-gray-700 font-medium">Contact Person</Label>
                    <p className="text-gray-600">
                      {profile.contact_person_first_name} {profile.contact_person_last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Contact Person Email
                    </Label>
                    <p className="text-gray-600">{profile.contact_person_email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Contact Person Phone
                    </Label>
                    <p className="text-gray-600">{profile.contact_person_phone || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Location & focus section */}
              <Card className={sectionCardClass}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    Location & focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-gray-700 font-medium">Address</Label>
                    <p className="text-gray-600">{profile.address || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Focus Areas</Label>
                    {profile.focus_areas && profile.focus_areas.length > 0 ? (
                      <ul className="mt-1.5 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm text-gray-600 list-none space-y-1.5">
                        {profile.focus_areas.map((area) => (
                          <li key={area} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-diaspora-blue" aria-hidden />
                            {area.charAt(0).toUpperCase() + area.slice(1).replace(/_/g, " ")}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm mt-1">No focus areas listed.</p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-gray-700 font-medium">Operating Cities</Label>
                      {profile.environment_cities && profile.environment_cities.length > 0 ? (
                        <ul className="mt-1.5 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm text-gray-600 list-none space-y-1.5">
                          {profile.environment_cities.map((city) => (
                            <li key={city} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" aria-hidden />
                              {city}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm mt-1">No cities listed.</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Operating States</Label>
                      {profile.environment_states && profile.environment_states.length > 0 ? (
                        <ul className="mt-1.5 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm text-gray-600 list-none space-y-1.5">
                          {profile.environment_states.map((state) => (
                            <li key={state} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" aria-hidden />
                              {state}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm mt-1">No states listed.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <Card className={sectionCardClass}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        Organization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="profile_picture"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Profile Picture</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                              />
                            </FormControl>
                            {profile.profile_picture && (
                              <div className="mt-2">
                                <Image
                                  src={profile.profile_picture}
                                  alt="Current Profile Picture"
                                  width={80}
                                  height={80}
                                  className="rounded-full border border-gray-200"
                                />
                              </div>
                            )}
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Organization Name <Building className="inline h-4 w-4 text-gray-500 ml-1" />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter organization name"
                                className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="organization_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Display Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter display name"
                                className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="organization_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Organization Type</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter organization type"
                                className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tax_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Tax ID</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter tax ID"
                                className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium flex items-center gap-1">
                          <Mail className="h-4 w-4 text-gray-500" />
                          Organization Email
                        </Label>
                        <Input
                          value={profile.email || ""}
                          readOnly
                          className="border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed rounded-lg"
                        />
                        <p className="text-xs text-gray-500">Account email from registration; not editable here.</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="organization_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                              <Phone className="h-4 w-4 text-gray-500" />
                              Organization Phone
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder="Enter organization phone"
                                className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                              <Globe className="h-4 w-4 text-gray-500" />
                              Website
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                                placeholder="Enter website URL"
                                className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="text-gray-700 font-medium">Description</FormLabel>
                            <FormControl>
                              <textarea
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                                placeholder="Enter organization description"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className={sectionCardClass}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="contact_person_first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Contact Person First Name <User className="inline h-4 w-4 text-gray-500 ml-1" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter first name"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_person_last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Contact Person Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter last name"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_person_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Contact Email <Mail className="inline h-4 w-4 text-gray-500 ml-1" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter contact email"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_person_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Contact Phone <Phone className="inline h-4 w-4 text-gray-500 ml-1" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter contact phone"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    </CardContent>
                  </Card>

                  <Card className={sectionCardClass}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        Location & focus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Address <MapPin className="inline h-4 w-4 text-gray-500 ml-1" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter address"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="focus_areas"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="text-gray-700 font-medium">Focus Areas</FormLabel>
                          <FormControl>
                            <Input
                              value={field.value.join(", ") || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                              placeholder="e.g., education, health, environment"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="environment_cities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Operating Cities</FormLabel>
                          <FormControl>
                            <Input
                              value={field.value?.join(", ") || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                              placeholder="e.g., Lagos, Abuja"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="environment_states"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Operating States</FormLabel>
                          <FormControl>
                            <Input
                              value={field.value?.join(", ") || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                              placeholder="e.g., Lagos State, Ogun State"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    </CardContent>
                  </Card>

                  <div className="flex gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="submit"
                          className="w-full action-btn text-white font-semibold rounded-lg transition-colors duration-200 py-2 disabled:opacity-70"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                              <span className="ml-2">Saving...</span>
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-sm">Save updated profile details</TooltipContent>
                    </Tooltip>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setProfilePictureFile(null);
                        if (profile) {
                          form.reset({
                            full_name: profile.full_name || "",
                            description: profile.description || null,
                            address: profile.address || "",
                            organization_name: profile.organization_name || "",
                            contact_person_first_name: profile.contact_person_first_name || "",
                            contact_person_last_name: profile.contact_person_last_name || "",
                            contact_person_email: profile.contact_person_email || "",
                            contact_person_phone: profile.contact_person_phone || "",
                            website: profile.website || null,
                            organization_type: profile.organization_type || "",
                            tax_id: profile.tax_id || "",
                            focus_areas: profile.focus_areas || [],
                            environment_cities: profile.environment_cities || [],
                            environment_states: profile.environment_states || [],
                            profile_picture: profile.profile_picture || null,
                            organization_phone: profile.phone ?? "",
                          });
                        }
                      }}
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg py-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Profile;