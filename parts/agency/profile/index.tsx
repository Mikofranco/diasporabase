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
import { Edit2, MapPin, User, Globe, Phone, Mail, Building } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
  website: z.string().url("Invalid URL.").nullable(),
  organization_type: z.string().min(1, "Organization type is required.").trim(),
  tax_id: z.string().min(1, "Tax ID is required.").trim(),
  focus_areas: z.array(z.string()).min(1, "At least one focus area is required."),
  environment_cities: z.array(z.string()).nullable(),
  environment_states: z.array(z.string()).nullable(),
  profile_picture: z.string().url("Invalid URL.").nullable(),
});

interface Profile {
  id: string;
  full_name: string;
  email: string;
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

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
    setLoading(true);
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
          // Remove updated_at; handled by database trigger
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
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-8 max-w-4xl">
        <Skeleton className="h-12 w-1/3 rounded-lg" />
        <Card className="shadow-xl border-0">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card className="border-red-200 bg-red-50 shadow-md">
          <CardContent className="pt-6 text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card className="shadow-md">
          <CardContent className="pt-6 text-gray-600">Profile not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-8 space-y-8 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Agency Profile</h1>
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

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">
              {profile.full_name}
            </CardTitle>
            <CardDescription className="text-gray-600">Agency Profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {!isEditing ? (
              <div className="space-y-6">
                {profile.profile_picture && (
                  <div className="flex justify-center">
                    <Image
                      src={profile.profile_picture}
                      alt="Profile Picture"
                      width={120}
                      height={120}
                      className="rounded-full border border-gray-200"
                    />
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-gray-700 font-medium">Organization Name</Label>
                    <p className="text-gray-600">{profile.organization_name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">
                      Contact Person <User className="inline h-4 w-4 text-gray-500 ml-1" />
                    </Label>
                    <p className="text-gray-600">
                      {profile.contact_person_first_name} {profile.contact_person_last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">
                      Email <Mail className="inline h-4 w-4 text-gray-500 ml-1" />
                    </Label>
                    <p className="text-gray-600">{profile.contact_person_email || profile.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">
                      Phone <Phone className="inline h-4 w-4 text-gray-500 ml-1" />
                    </Label>
                    <p className="text-gray-600">{profile.contact_person_phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">
                      Website <Globe className="inline h-4 w-4 text-gray-500 ml-1" />
                    </Label>
                    <p className="text-gray-600">
                      {profile.website ? (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">
                      Organization Type <Building className="inline h-4 w-4 text-gray-500 ml-1" />
                    </Label>
                    <p className="text-gray-600">{profile.organization_type || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Tax ID</Label>
                    <p className="text-gray-600">{profile.tax_id || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">
                      Address <MapPin className="inline h-4 w-4 text-gray-500 ml-1" />
                    </Label>
                    <p className="text-gray-600">{profile.address || "N/A"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-gray-700 font-medium">Description</Label>
                    <p className="text-gray-600">{profile.description || "No description provided."}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-gray-700 font-medium">Focus Areas</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.focus_areas && profile.focus_areas.length > 0 ? (
                        profile.focus_areas.map((area) => (
                          <Badge
                            key={area}
                            variant="default"
                            className="bg-blue-600 text-white rounded-md px-2 py-1 text-sm"
                          >
                            {area.charAt(0).toUpperCase() + area.slice(1).replace("_", " ")}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-600">No focus areas listed.</p>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-gray-700 font-medium">Operating Cities</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.environment_cities && profile.environment_cities.length > 0 ? (
                        profile.environment_cities.map((city) => (
                          <Badge
                            key={city}
                            variant="default"
                            className="bg-blue-600 text-white rounded-md px-2 py-1 text-sm"
                          >
                            {city}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-600">No cities listed.</p>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-gray-700 font-medium">Operating States</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.environment_states && profile.environment_states.length > 0 ? (
                        profile.environment_states.map((state) => (
                          <Badge
                            key={state}
                            variant="default"
                            className="bg-blue-600 text-white rounded-md px-2 py-1 text-sm"
                          >
                            {state}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-600">No states listed.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                  <div className="grid gap-6 sm:grid-cols-2">
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                          <FormLabel className="text-gray-700 font-medium">
                            Display Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter display name"
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                          <FormLabel className="text-gray-700 font-medium">
                            Website <Globe className="inline h-4 w-4 text-gray-500 ml-1" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              placeholder="Enter website URL"
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                          <FormLabel className="text-gray-700 font-medium">
                            Organization Type <Building className="inline h-4 w-4 text-gray-500 ml-1" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter organization type"
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                        <FormItem className="sm:col-span-2">
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                        <FormItem className="sm:col-span-2">
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
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition-shadow duration-200 hover:shadow-sm"
                              rows={6}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 py-2"
                          disabled={loading}
                        >
                          Save Changes
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
                        form.reset();
                      }}
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg py-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default Profile;