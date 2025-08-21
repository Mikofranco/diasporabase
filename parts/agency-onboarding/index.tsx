// app/onboarding/agency/page.tsx
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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { MapPin, User, Globe, Phone, Mail, Building } from "lucide-react";
import Select from "react-select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  // Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { CategoryCheckBox } from "@/components/ui/select-caegories";

const supabase = createClient();

// Predefined organization types
const organizationTypes = [
  "NGO",
  "Government Agency",
  "Non-Profit",
  "Private Sector",
  "Educational Institution",
  "Other",
];

// Updated form validation schemas to align with Profile interface
const generalSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required.").trim(),
  full_name: z.string().min(1, "Display name is required.").trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters.")
    .nullable(),
  organization_type: z.string().min(1, "Organization type is required.").trim(),
  tax_id: z.string().min(1, "Tax ID is required.").trim(),
});

const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required.").trim(),
  surname: z.string().min(1, "Surname is required.").trim(),
  contact_person_email: z
    .string()
    .email("Invalid email address.")
    .min(1, "Email is required."),
  contact_person_phone: z.string().min(1, "Phone number is required.").trim(),
  website: z.string().url("Invalid URL.").nullable(),
});

const operationalSchema = z.object({
  address: z.string().min(1, "Address is required.").trim(),
  focus_areas: z
    .array(z.string())
    .min(1, "At least one focus area is required."),
  environment_cities: z.array(z.string()).nullable(),
  environment_states: z.array(z.string()).nullable(),
});

const pictureSchema = z.object({
  profile_picture: z.string().url("Invalid URL.").nullable(),
});

const formSchema = z.object({
  ...generalSchema.shape,
  ...contactSchema.shape,
  ...operationalSchema.shape,
  ...pictureSchema.shape,
});

const focusAreaOptions = [
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "environment", label: "Environment" },
  { value: "technology", label: "Technology" },
  { value: "social_services", label: "Social Services" },
];

// Profile interface (unchanged)
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

const AgencyOnboarding: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const router = useRouter();

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      description: null,
      address: "",
      organization_name: "",
      first_name: "",
      surname: "",
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
        if (!userId) throw new Error("Please log in to complete onboarding.");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
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
          `
          )
          .eq("id", userId)
          .eq("role", "agency")
          .single();

        if (profileError)
          throw new Error("Error fetching profile: " + profileError.message);
        if (!profileData)
          throw new Error("Profile not found or you are not an agency.");

        setProfile(profileData);
        form.reset({
          full_name: profileData.full_name || "",
          description: profileData.description || null,
          address: profileData.address || "",
          organization_name: profileData.organization_name || "",
          first_name: profileData.contact_person_first_name || "",
          surname: profileData.contact_person_last_name || "",
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

        // Check if profile is complete
        if (
          profileData.organization_name &&
          profileData.focus_areas &&
          profileData.focus_areas.length > 0 &&
          profileData.address
        ) {
          router.push("/dashboard/agency");
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form, router]);

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePictureFile(e.target.files[0]);
    }
  };

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger([
        "organization_name",
        "full_name",
        "description",
        "organization_type",
        "tax_id",
      ]);
    } else if (step === 2) {
      isValid = await form.trigger([
        "first_name",
        "surname",
        "contact_person_email",
        "contact_person_phone",
        "website",
      ]);
    } else if (step === 3) {
      isValid = await form.trigger([
        "address",
        "focus_areas",
        "environment_cities",
        "environment_states",
      ]);
    } else if (step === 4) {
      isValid = await form.trigger(["profile_picture"]);
    }

    if (isValid && step < 4) {
      setStep(step + 1);
    } else if (isValid && step === 4) {
      form.handleSubmit(handleSubmit)();
    } else {
      toast.error("Please fill out all required fields correctly.");
    }
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to complete onboarding.");

      let profilePictureUrl = data.profile_picture;
      if (profilePictureFile) {
        const fileExt = profilePictureFile.name.split(".").pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, profilePictureFile, { upsert: true });

        if (uploadError)
          throw new Error(
            "Error uploading profile picture: " + uploadError.message
          );

        const { data: publicUrlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(fileName);
        profilePictureUrl = publicUrlData.publicUrl;
      }

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          description: data.description,
          address: data.address,
          organization_name: data.organization_name,
          contact_person_first_name: data.first_name,
          contact_person_last_name: data.surname,
          contact_person_email: data.contact_person_email,
          contact_person_phone: data.contact_person_phone,
          website: data.website,
          organization_type: data.organization_type,
          tax_id: data.tax_id,
          focus_areas: data.focus_areas,
          environment_cities: data.environment_cities,
          environment_states: data.environment_states,
          profile_picture: profilePictureUrl,
          // Do not manually set updated_at; let the database trigger handle it
        })
        .eq("id", userId)
        .eq("role", "agency");

      if (updateError)
        throw new Error("Error updating profile: " + updateError.message);

      // Update profile state
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: data.full_name,
              email: prev.email, // Preserve email
              role: prev.role, // Preserve role
              description: data.description,
              address: data.address,
              organization_name: data.organization_name,
              contact_person_first_name: data.first_name,
              contact_person_last_name: data.surname,
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
      toast.success("Onboarding completed successfully!");
      router.push("/dashboard/agency");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-8 max-w-4xl min-h-screen bg-gradient-to-b from-blue-950 to-blue-900">
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
      <div className="container mx-auto p-8 max-w-4xl min-h-screen bg-gradient-to-b from-blue-950 to-blue-900">
        <Card className="border-red-200 bg-red-50 shadow-md">
          <CardContent className="pt-6 text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-8 max-w-4xl min-h-screen bg-gradient-to-b from-blue-950 to-blue-900">
        <Card className="shadow-md">
          <CardContent className="pt-6 text-gray-600">
            Profile not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-8 space-y-8 max-w-4xl min-h-screen bg-gradient-to-b from-blue-950 to-blue-900">
        <h1 className="text-3xl font-bold text-white">Agency Onboarding</h1>
        <Progress value={(step / 4) * 100} className="h-2 bg-blue-200" />
        <p className="text-sm text-blue-200">Step {step} of 4</p>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">
              {step === 1 && "General Information"}
              {step === 2 && "Contact Details"}
              {step === 3 && "Operational Details"}
              {step === 4 && "Profile Picture"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {step === 1 && "Tell us about your organization."}
              {step === 2 &&
                "Provide contact information for your organization."}
              {step === 3 && "Specify your operational scope and focus areas."}
              {step === 4 && "Upload a profile picture for your organization."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-8"
              >
                {step === 1 && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="organization_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Organization Name{" "}
                            <Building className="inline h-4 w-4 text-gray-500 ml-1" />
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
                      name="full_name"
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
                    <CategoryCheckBox/>\
                    <FormField
                      control={form.control}
                      name="tax_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Tax ID
                          </FormLabel>
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
                      name="description"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="text-gray-700 font-medium">
                            Description
                          </FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || null)
                              }
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
                )}

                {step === 2 && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            First Name{" "}
                            <User className="inline h-4 w-4 text-gray-500 ml-1" />
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
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Surname
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter surname"
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
                            Contact Email{" "}
                            <Mail className="inline h-4 w-4 text-gray-500 ml-1" />
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
                            Contact Phone{" "}
                            <Phone className="inline h-4 w-4 text-gray-500 ml-1" />
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
                            Website{" "}
                            <Globe className="inline h-4 w-4 text-gray-500 ml-1" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || null)
                              }
                              placeholder="Enter website URL"
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Address{" "}
                            <MapPin className="inline h-4 w-4 text-gray-500 ml-1" />
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
                          <FormLabel className="text-gray-700 font-medium">
                            Focus Areas
                          </FormLabel>
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
                      name="focus_areas"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="text-gray-700 font-medium">
                            Focus Areas{" "}
                            <span className="text-gray-500 text-sm">
                              (Select all that apply)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              isMulti
                              options={focusAreaOptions}
                              value={focusAreaOptions.filter((option) =>
                                field.value.includes(option.value)
                              )}
                              onChange={(selected) =>
                                field.onChange(selected.map((opt) => opt.value))
                              }
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                              placeholder="Select focus areas"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: "#d1d5db",
                                  "&:hover": { borderColor: "#9ca3af" },
                                  boxShadow: "none",
                                }),
                                menu: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
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
                          <FormLabel className="text-gray-700 font-medium">
                            Operating Cities
                          </FormLabel>
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
                          <FormLabel className="text-gray-700 font-medium">
                            Operating States
                          </FormLabel>
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
                  </div>
                )}

                {step === 4 && (
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="profile_picture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Profile Picture
                          </FormLabel>
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
                  </div>
                )}

                <div className="flex gap-4">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg py-2"
                    >
                      Previous
                    </Button>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 py-2"
                        disabled={loading}
                      >
                        {step === 4 ? "Complete Onboarding" : "Next"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-sm">
                      {step === 4
                        ? "Save and complete onboarding"
                        : "Proceed to the next step"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default AgencyOnboarding;
