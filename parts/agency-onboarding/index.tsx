"use client";

import { createClient } from "@/lib/supabase/client";
import {
  getSkillsets as getSkillSets,
  getUserId,
  getUserLocation,
} from "@/lib/utils";
import React, { useState, useEffect, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  MapPin,
  User,
  Globe,
  Phone,
  Mail,
  Building,
  Loader2,
} from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
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
import CategorySelect from "@/components/category-select";
import SingleImageUploader, {
  SingleImageUploaderRef,
} from "@/components/single-image_uploader";
import MultipleImageUploader, {
  MultipleImageUploaderRef,
} from "@/components/multi-image-uploader";
import { SkillSet } from "@/lib/types";
import { routes } from "@/lib/routes";

const supabase = createClient();

const organizationTypes = [
  "NGO",
  "Government Agency",
  "Non-Profit",
  "Private Sector",
  "Educational Institution",
  "Other",
];

const focusAreaOptions: SkillSet[] = [];

const generalSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required.").trim(),
  full_name: z.string().min(1, "Display name is required.").trim(),
  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters.")
    .nullable(),
  organization_type: z.enum(organizationTypes as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid organization type." }),
  }),
  tax_id: z.string().min(1, "Tax ID is required.").trim(),
  website: z
    .string()
    .refine(
      (value) => {
        return /^(?:(https?:\/\/)(www\.)?)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(
          value,
        );
      },
      {
        message:
          "Invalid URL. Must be a valid URL with http://, https://, or start with www.",
      },
    )
    .nullable(),
  cac_number: z.string().min(1, "CAC number is required.").trim(),
});

const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required.").trim(),
  surname: z.string().min(1, "Surname is required.").trim(),
  contact_person_email: z
    .string()
    .email("Invalid email address.")
    .min(1, "Email is required."),
  contact_person_phone: z.string().min(1, "Phone number is required.").trim(),
});

const operationalSchema = z.object({
  address: z.string().min(1, "Address is required.").trim(),
  focus_areas: z
    .array(z.string())
    .min(1, "At least one focus area is required."),
  environment_cities: z.array(z.string()).optional().nullable(),
  environment_states: z.array(z.string()).optional().nullable(),
});

const pictureSchema = z.object({
  profile_picture: z.string().url("Invalid URL.").nullable(),
  documents: z.array(z.string().url("Invalid URL.")).nullable(),
});

const formSchema = z.object({
  ...generalSchema.shape,
  ...contactSchema.shape,
  ...operationalSchema.shape,
  ...pictureSchema.shape,
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
  documents: string[] | null;
}

const AgencyOnboarding: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const singleRef = useRef<SingleImageUploaderRef>(null);
  const multipleRef = useRef<MultipleImageUploaderRef>(null);
  const router = useRouter();
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const [hasProfileImageSelected, setHasProfileImageSelected] = useState(false);
  const [documentsSelectedCount, setDocumentsSelectedCount] = useState(0);
  const [organizationEmail, setOrganizationEmail] = useState<string>("");
  const [organizationPhone, setOrganizationPhone] = useState<string>("");

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
      organization_type: organizationTypes[0],
      tax_id: "",
      focus_areas: [],
      environment_cities: [],
      environment_states: [],
      profile_picture: null,
      cac_number: "",
      documents: [],
    },
  });

  useEffect(() => {
    const fetchProfileAndLocation = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to complete onboarding.");

        const skillSets = await getSkillSets();
        if(focusAreaOptions.length === 0)  focusAreaOptions.push(
          ...skillSets.map((skill) => ({ id: skill.id, label: skill.label })),
        );
        
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
          `,
          )
          .eq("id", userId)
          .eq("role", "agency")
          .single();

        if (profileError)
          throw new Error("Error fetching profile: " + profileError.message);
        if (!profileData)
          throw new Error("Profile not found or you are not an agency.");

        const { data: { user: authUser } } = await supabase.auth.getUser();
        setOrganizationEmail(profileData.email || authUser?.email || "");
        setOrganizationPhone((authUser?.user_metadata?.phone as string) || "");

        setProfile(profileData);
        form.reset({
          full_name: profileData.full_name || "",
          description: profileData.description || null,
          address: profileData.address || "",
          organization_name: profileData.full_name || "",
          first_name: profileData.contact_person_first_name || "",
          surname: profileData.contact_person_last_name || "",
          contact_person_email: profileData.contact_person_email || "",
          contact_person_phone: profileData.contact_person_phone || "",
          website: profileData.website || null,
          organization_type:
            profileData.organization_type || organizationTypes[0],
          tax_id: profileData.tax_id || "",
          focus_areas: profileData.focus_areas || [],
          environment_cities: profileData.environment_cities || [],
          environment_states: profileData.environment_states || [],
          profile_picture: profileData.profile_picture || null,
          documents: profileData.documents || [],
        });

        // Fetch and set location
        try {
          const location = await getUserLocation();
          if (location) {
            const updatedCities = location.city ? [location.city] : [];
            const updatedStates = location.region ? [location.region] : [];
            form.setValue("environment_cities", updatedCities, {
              shouldValidate: false,
            });
            form.setValue("environment_states", updatedStates, {
              shouldValidate: false,
            });
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    environment_cities: updatedCities,
                    environment_states: updatedStates,
                  }
                : profileData,
            );
            console.log("Location fetched and set:", {
              environment_cities: updatedCities,
              environment_states: updatedStates,
            });
          } else {
            console.warn("No location data returned from getUserLocation");
          }
        } catch (locationError) {
          console.error("Error fetching user location:", locationError);
        }

        if (
          profileData.organization_name &&
          profileData.focus_areas &&
          profileData.focus_areas.length > 0 &&
          profileData.address
        ) {
          router.push(routes.agencyDashboard);
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndLocation();
  }, [form, router]);

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
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
        "cac_number",
      ]);
      if (!isValid) {
        console.log("Step 1 validation errors:", form.formState.errors);
      }
    } else if (step === 2) {
      isValid = await form.trigger([
        "first_name",
        "surname",
        "contact_person_email",
        "contact_person_phone",
        "website",
      ]);
    } else if (step === 3) {
      isValid = await form.trigger(["address", "focus_areas"]);
    } else if (step === 4) {
      setDocumentsError(null);
      setProfileImageError(null);
      if (!hasProfileImageSelected) {
        setProfileImageError("Please upload a business logo (profile picture).");
        return;
      }
      if (documentsSelectedCount < 1) {
        setDocumentsError("Please upload at least one supporting document.");
        return;
      }
      isValid = await form.trigger(["profile_picture"]);
      isValid = (await form.trigger(["documents"])) && isValid;
    }

    if (isValid && step < 4) {
      setStep(step + 1);
    } else if (isValid && step === 4) {
      form.handleSubmit(handleSubmit)();
    } else if (step !== 4) {
      toast.error("Please fill out all required fields correctly.");
    }
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsCompleting(true);

    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to complete onboarding.");

      // let profilePictureUrl = data.profile_picture;
      // if (profilePictureFile) {
      //   const fileExt = profilePictureFile.name.split(".").pop();
      //   const fileName = `${userId}_${Date.now()}.${fileExt}`;
      //   const { error: uploadError } = await supabase.storage
      //     .from("profile-pictures")
      //     .upload(fileName, profilePictureFile, { upsert: true });

      //   if (uploadError)
      //     throw new Error(
      //       "Error uploading profile picture: " + uploadError.message,
      //     );

      //   const { data: publicUrlData } = supabase.storage
      //     .from("profile-pictures")
      //     .getPublicUrl(fileName);
      //   profilePictureUrl = publicUrlData.publicUrl;
      // }

      const picture_singleUrl = await singleRef.current?.upload();

      // Upload multiple images
      const multipleUrls = await multipleRef.current?.upload();
      if (multipleUrls && multipleUrls.length > 0) {
        console.log("Multiple documents uploaded:", multipleUrls);
      } else {
        setDocumentsError(
          "No documents uploaded. Please upload at least one document.",
        );
      }
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
          profile_picture: picture_singleUrl,
          cac_number: data.cac_number,
          documents:
            multipleUrls && multipleUrls.length > 0
              ? multipleUrls
              : profile?.documents || null,
        })
        .eq("id", userId)
        .eq("role", "agency");

      if (updateError)
        throw new Error("Error updating profile: " + updateError.message);
      //@ts-ignore
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: data.full_name,
              email: prev.email,
              role: prev.role,
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
              profile_picture: picture_singleUrl,
              cac_number: data.cac_number,
              documents:
                multipleUrls && multipleUrls.length > 0
                  ? multipleUrls
                  : prev.documents,
            }
          : null,
      );
      router.push(routes.agencyDashboard);
    } catch (err: any) {
      setIsCompleting(false);
      setError(err.message);
    }
  };

  const locationDisplay =
    [
      form.getValues("environment_states")?.[0],
      form.getValues("environment_cities")?.[0],
    ]
      .filter(Boolean)
      .join(", ") || "Unknown";

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl min-h-0">
        <Skeleton className="h-8 w-48 rounded-lg mb-6" />
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader>
            <Skeleton className="h-7 w-2/3 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl min-h-screen">
        <Card className="border-red-200 bg-red-50/80 shadow-lg rounded-2xl">
          <CardContent className="pt-6 pb-6 text-red-700 font-medium">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl min-h-screen">
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="pt-6 pb-6 text-gray-600">
            Profile not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const stepTitles = [
    "General Information",
    "Contact Details",
    "Operational Details",
    "Upload Documents",
  ];
  const stepDescriptions = [
    "Tell us about your organization.",
    "Provide contact information for your organization.",
    "Specify your operational scope and focus areas.",
    "Upload a profile picture and important documents for your organization.",
  ];

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 sm:px-6 pt-4 pb-6 sm:pt-6 sm:pb-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Agency Onboarding
          </h1>
          <p className="mt-1 text-sm text-blue-200/90">
            Step {step} of 4
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/25">
            <Progress
              value={(step / 4) * 100}
              className="h-full bg-transparent transition-all duration-500 ease-out"
              indicatorClassName="bg-[#0ea5e9]"
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs font-medium text-white drop-shadow-sm">
            <span>General</span>
            <span>Contact</span>
            <span>Operations</span>
            <span>Documents</span>
          </div>
        </div>

        <div className="flex flex-col max-h-[calc(95vh-18rem)] min-h-0">
          <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
            <CardHeader className="pb-4 sm:pb-6 shrink-0">
              <CardTitle className="text-xl sm:text-2xl text-gray-900 font-semibold">
                {stepTitles[step - 1]}
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base mt-1">
                {stepDescriptions[step - 1]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 flex-1 min-h-0 overflow-y-auto scrollbar-hide p-6 pt-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-8"
              >
                {/* Step 1: always in DOM for form state; use grid so layout is correct */}
                <div
                  className="grid gap-x-6 gap-y-8 sm:grid-cols-2"
                  style={{ display: step === 1 ? "grid" : "none" }}
                >
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
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <label className="text-gray-700 font-medium text-sm">
                        Organization Email{" "}
                        <Mail className="inline h-4 w-4 text-gray-500 ml-1" />
                      </label>
                      <Input
                        value={organizationEmail}
                        readOnly
                        className="border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-gray-700 font-medium text-sm">
                        Organization Phone {" "}
                        <Phone className="inline h-4 w-4 text-gray-500 ml-1" />
                      </label>
                      <Input
                        value={organizationPhone}
                        className="border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed rounded-lg"
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="organization_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Organization Type
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
                                <SelectValue placeholder="Select organization type" />
                              </SelectTrigger>
                              <SelectContent>
                                {organizationTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                          <FormLabel className="text-gray-700 font-medium">
                            Tax ID
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter tax ID"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cac_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            CAC Number{" "}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || null)
                              }
                              placeholder="Enter CAC number"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y transition-shadow duration-200 hover:shadow-sm"
                              rows={6}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Step 2 */}
                <div
                  className="grid gap-x-6 gap-y-8 sm:grid-cols-2"
                  style={{ display: step === 2 ? "grid" : "none" }}
                >
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
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                            Contact Person Email{" "}
                            <Mail className="inline h-4 w-4 text-gray-500 ml-1" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter contact person email"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                            Contact Person Phone{" "}
                            <Phone className="inline h-4 w-4 text-gray-500 ml-1" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter contact person phone"
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Step 3 */}
                <div
                  className="grid gap-x-6 gap-y-8 sm:grid-cols-2"
                  style={{ display: step === 3 ? "grid" : "none" }}
                >
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
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Location{" "}
                        <MapPin className="inline h-4 w-4 text-gray-500 ml-1" />
                      </FormLabel>
                      <FormControl>
                        <Input
                          value={locationDisplay}
                          disabled
                          className="border-gray-300 bg-gray-100 rounded-lg"
                          placeholder="Location not available"
                        />
                      </FormControl>
                    </FormItem>
                    <FormField
                      control={form.control}
                      name="focus_areas"
                      render={() => (
                        <FormItem className="sm:col-span-2">
                          <CategoryCheckBox
                            control={form.control}
                            name="focus_areas"
                            items={focusAreaOptions}
                            label="Focus Areas"
                            description="Select the focus areas for your organization."
                            onSelectionChange={(selected) => {
                              console.log("Selected focus areas:", selected);
                            }}
                            showToast={false}
                          />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Step 4: kept in DOM so image/doc selection persists when navigating back */}
                <div
                  className="grid gap-6 gap-y-7"
                  style={{ display: step === 4 ? "grid" : "none" }}
                >
                    {/* <FormField
                      control={form.control}
                      name="profile_picture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Business Logo
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureChange}
                              className="border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-shadow duration-200 hover:shadow-sm"
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
                    /> */}
                    <div className="space-y-2">
                      <h3 className="text-gray-800 font-semibold">
                        Profile Picture (Business Logo)
                      </h3>
                      <p className="text-sm text-gray-600">
                        Upload a clear logo or photo of your organization. Your selection is saved as you move between steps.
                      </p>
                      <SingleImageUploader
                        ref={singleRef}
                        title=""
                        onFileSelected={(file) => {
                          setHasProfileImageSelected(!!file);
                          if (file) setProfileImageError(null);
                        }}
                      />
                      {profileImageError && (
                        <p className="text-red-500 text-sm">{profileImageError}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-gray-800 font-semibold">
                        Supporting Documents
                        <span className="text-red-500 text-sm ml-1 font-normal">
                          (at least one recommended)
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600">
                        Upload CAC certificate, registration documents, or other relevant files (PDF, JPG, PNG). Selections are kept when you go back to previous steps.
                      </p>
                      <MultipleImageUploader
                        ref={multipleRef}
                        title=""
                        onFilesChange={(files) => {
                          setDocumentsSelectedCount(files?.length ?? 0);
                          if ((files?.length ?? 0) > 0) setDocumentsError(null);
                        }}
                      />
                      {documentsError && (
                        <p className="text-red-500 text-sm">{documentsError}</p>
                      )}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className="min-w-[100px] border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl py-2.5 transition-colors"
                    >
                      Previous
                    </Button>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="flex-1 action-btn text-white font-semibold rounded-xl py-2.5 transition-all duration-200 hover:opacity-95 disabled:opacity-70 disabled:pointer-events-none"
                        disabled={loading || isCompleting}
                      >
                        {isCompleting || loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                            <span className="ml-2">
                              {step === 4 ? "Completing..." : "Processing..."}
                            </span>
                          </>
                        ) : step === 4 ? (
                          "Complete Onboarding"
                        ) : (
                          "Next"
                        )}
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
      </div>
    </TooltipProvider>
  );
};

export default AgencyOnboarding;
