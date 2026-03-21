"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CalendarIcon, Pencil, X, Twitter, Linkedin, Globe } from "lucide-react";
import { CheckboxReactHookFormMultiple } from "@/components/renderedItems";
import { LocationSelects } from "@/components/location-selects";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, getSkillsets, getUserLocation, truncate } from "@/lib/utils";
import { toast } from "sonner";
import LocationSelector from "@/components/location-selector";
import { useSkillLabels } from "@/hooks/useSkillLabels";
import XLogo from "@/components/x_logo";


function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export interface ProfileData {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  skills: string[] | null;
  availability: string | null;
  experience: string | null;
  residence_country: string | null;
  residence_state: string | null;
  origin_country: string | null;
  origin_state: string | null;
  origin_lga: string | null;
  volunteer_countries: string[] | null;
  volunteer_states: string[] | null;
  volunteer_lgas: string[] | null;
  profile_picture: string | null;
  anonymous: boolean | null;
  x_link?: string | null;
  linkedin_link?: string | null;
  website?: string | null;
}

export interface SelectedData {
  selectedCountries: string[];
  selectedStates: string[];
  selectedLgas: string[];
}

export interface LocationSelectorHandle {
  setSelected: (data: SelectedData) => void;
}

function ProfileSkeleton() {
  return (
    <Card className="w-full max-w-7xl mx-auto border-gray-200 rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-24 shrink-0 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manage your personal block */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 space-y-6">
          <Skeleton className="h-5 w-48" />
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full shrink-0" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Skills & availability block */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
        {/* Experience & preferences block */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-24 w-full rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-28" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VolunteerProfile() {
  const { getLabel } = useSkillLabels();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [availabilityType, setAvailabilityType] = useState<
    "full-time" | "specific-period"
  >("full-time");
  const [availabilityStartDate, setAvailabilityStartDate] = useState<
    Date | undefined
  >(undefined);
  const [availabilityEndDate, setAvailabilityEndDate] = useState<
    Date | undefined
  >(undefined);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expertiseData, setExpertiseData] = useState<any[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<SelectedData>({
    selectedCountries: [],
    selectedStates: [],
    selectedLgas: [],
  });

  const supabase = createClient();
  const router = useRouter();
  const locationSelectorRef = useRef<LocationSelectorHandle>(null);

  const handleLocationChange = useCallback((data: SelectedData) => {
    setSelectedLocations(data);
  }, []);

  // Fetch skillsets
  useEffect(() => {
    const fetchSkillsets = async () => {
      const skillsets = await getSkillsets();
      setExpertiseData(skillsets);
    };
    fetchSkillsets();
  }, []);

  // Fetch profile and location
  useEffect(() => {
    const fetchProfileAndLocation = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error fetching user:", userError);
        setMessage({
          text: "Please log in to view your profile.",
          isError: true,
        });
        setLoading(false);
        return;
      }

      setUserEmail(user.email);
      setUserPhone(user.phone || null);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, email, phone, date_of_birth, address, skills, availability, experience, residence_country, residence_state, origin_country, origin_state, origin_lga, volunteer_countries, volunteer_states, volunteer_lgas, profile_picture, anonymous, x_link, linkedin_link, website"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setMessage({ text: "Failed to load profile data.", isError: true });
        setLoading(false);
        return;
      }

      const profileData = {
        ...data,
        skills: data.skills || [],
        volunteer_countries: data.volunteer_countries || [],
        volunteer_states: data.volunteer_states || [],
        volunteer_lgas: data.volunteer_lgas || [],
        profile_picture: data.profile_picture || null,
        anonymous: data.anonymous ?? false,
      };

      setProfile(profileData);
      setSelectedSkill(data.skills || []);
      setSelectedLocations({
        selectedCountries: data.volunteer_countries || [],
        selectedStates: data.volunteer_states || [],
        selectedLgas: data.volunteer_lgas || [],
      });
      setImagePreview(data.profile_picture || null);

      // Handle availability
      if (data.availability === "full-time") {
        setAvailabilityType("full-time");
      } else if (data.availability) {
        try {
          const parsed = JSON.parse(data.availability);
          setAvailabilityType("specific-period");
          setAvailabilityStartDate(
            parsed.startDate ? new Date(parsed.startDate) : undefined
          );
          setAvailabilityEndDate(
            parsed.endDate ? new Date(parsed.endDate) : undefined
          );
        } catch (e) {
          console.error("Error parsing availability:", e);
          setAvailabilityType("full-time");
        }
      }

      // Apply geolocation
      try {
        const location = await getUserLocation();
        if (location) {
          setProfile((prev) => {
            if (!prev) return profileData;
            return {
              ...prev,
              residence_country:
                location.country || prev.residence_country || "Unknown",
              residence_state:
                location.region || prev.residence_state || "Unknown",
            };
          });
        }
      } catch (error) {
        console.error("Error fetching user location:", error);
      }

      setLoading(false);
    };

    fetchProfileAndLocation();
  }, [supabase]);

  // Sync saved volunteer locations into LocationSelector when ref is ready (e.g. when entering edit mode)
  useEffect(() => {
    if (!profile || !locationSelectorRef.current) return;
    locationSelectorRef.current.setSelected({
      selectedCountries: profile.volunteer_countries || [],
      selectedStates: profile.volunteer_states || [],
      selectedLgas: profile.volunteer_lgas || [],
    });
  }, [profile, isEditMode]);

  // Handle image upload
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (userId: string, file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handleInputChange = (
    field: keyof ProfileData,
    value: string | string[]
  ) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSkillsChange = (skills: string[]) => {
    setSelectedSkill(skills);
    handleInputChange("skills", skills);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (!profile) {
      toast.error("No profile data to save.");
      setSubmitting(false);
      return;
    }

    if (
      availabilityType === "specific-period" &&
      (!availabilityStartDate || !availabilityEndDate)
    ) {
      toast.error("Please select both start and end dates.");
      setSubmitting(false);
      return;
    }

    if (
      availabilityType === "specific-period" &&
      availabilityStartDate &&
      availabilityEndDate &&
      availabilityStartDate > availabilityEndDate
    ) {
      toast.error("Start date cannot be after end date.");
      setSubmitting(false);
      return;
    }

    // Use selectedLocations from state, or fall back to profile's saved locations (e.g. when LocationSelector hasn't synced yet)
    const locationsToSave = selectedLocations.selectedCountries.length > 0
      ? selectedLocations
      : {
        selectedCountries: profile.volunteer_countries || [],
        selectedStates: profile.volunteer_states || [],
        selectedLgas: profile.volunteer_lgas || [],
      };
    if (locationsToSave.selectedCountries.length === 0) {
      toast.error("Please select at least one volunteer location.");
      setSubmitting(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error("Authentication error. Please log in again.");
      setSubmitting(false);
      return;
    }

    let profilePictureUrl = profile.profile_picture;
    if (imageFile) {
      const uploadedUrl = await uploadImage(user.id, imageFile);
      if (uploadedUrl) {
        profilePictureUrl = uploadedUrl;
        setProfile((prev) =>
          prev ? { ...prev, profile_picture: uploadedUrl } : null
        );
      } else {
        toast.error("Failed to upload profile picture.");
        setSubmitting(false);
        return;
      }
    }

    const availabilityToStore =
      availabilityType === "full-time"
        ? "full-time"
        : JSON.stringify({
          startDate: availabilityStartDate
            ? format(availabilityStartDate, "yyyy-MM-dd")
            : null,
          endDate: availabilityEndDate
            ? format(availabilityEndDate, "yyyy-MM-dd")
            : null,
        });

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth,
        address: profile.address,
        skills: selectedSkill,
        availability: availabilityToStore,
        experience: profile.experience,
        residence_country: profile.residence_country,
        residence_state: profile.residence_state,
        origin_country: profile.origin_country,
        origin_state: profile.origin_state,
        origin_lga: profile.origin_lga,
        website: profile.website,
        x_link: profile.x_link,
        linkedin_link: profile.linkedin_link,
        volunteer_countries:
          locationsToSave.selectedCountries.length > 0
            ? locationsToSave.selectedCountries
            : null,
        volunteer_states:
          locationsToSave.selectedStates.length > 0
            ? locationsToSave.selectedStates
            : null,
        volunteer_lgas:
          locationsToSave.selectedLgas.length > 0
            ? locationsToSave.selectedLgas
            : null,
        email: user.email,
        profile_picture: profilePictureUrl,
        anonymous: profile.anonymous ?? false,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error.message}`);
    } else {
      toast.success("Profile updated successfully!");
      router.refresh();
      setMessage({ text: "Profile updated successfully!", isError: false });
      setIsEditMode(false);
    }
    setSubmitting(false);
  };

  const selectedLocationsDisplay = useMemo(() => {
    const { selectedCountries, selectedStates, selectedLgas } =
      selectedLocations;

    if (selectedStates?.length > 10) {
      return (
        <div className="text-sm text-gray-600 mt-2">
          <p>
            <strong>Countries:</strong> {selectedCountries.join(", ")}
          </p>
          <p className="text-xs italic text-gray-500">
            ({selectedStates.length} states selected — showing countries only)
          </p>
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-600 mt-2">
        {selectedCountries.length > 0 ? (
          <>
            <p>
              <strong>Countries:</strong> {selectedCountries.join(", ")}
            </p>
            {selectedStates.length > 0 && (
              <p>
                <strong>States:</strong> {selectedStates.join(", ")}
              </p>
            )}
            {selectedLgas.length > 0 && (
              <p>
                <strong>LGAs:</strong> {selectedLgas.join(", ")}
              </p>
            )}
          </>
        ) : (
          <p>No locations selected.</p>
        )}
      </div>
    );
  }, [selectedLocations]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-2xl font-bold text-gray-900">
            Profile Not Found
          </h3>
          <p className="text-sm text-gray-500">
            Could not load your profile data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const locationDisplay =
    [profile.residence_country, profile.residence_state]
      .filter(Boolean)
      .join(", ") || "Unknown";

  const isAnonymous = profile.anonymous === true;

  return (
    <Card className="w-full max-w-7xl mx-auto border-gray-200 rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Volunteer Profile
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            {isEditMode
              ? "Edit your personal information, skills, and volunteer preferences."
              : "View your personal information, skills, and volunteer preferences."}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant={isEditMode ? "outline" : "default"}
          className={cn(
            "shrink-0",
            !isEditMode && "action-btn border-0 text-white hover:opacity-90",
            isEditMode && "border-diaspora-blue text-diaspora-blue hover:bg-diaspora-blue/10"
          )}
          onClick={() => setIsEditMode((prev) => !prev)}
          aria-label={isEditMode ? "Cancel editing" : "Edit profile"}
        >
          {isEditMode ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" aria-live="polite">
          {/* Section: Manage your personal — avatar at top, then fields + anonymous */}
          <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Manage your personal information
            </h3>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              {/* Avatar — top of section */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <Avatar className="h-24 w-24 border-2 border-diaspora-blue/20 shadow-md bg-diaspora-blue/5">
                  {(imagePreview || profile.profile_picture) ? (
                    <AvatarImage
                      src={imagePreview || profile.profile_picture || undefined}
                      alt="Profile"
                    />
                  ) : null}
                  <AvatarFallback className="text-2xl bg-gradient-to-r from-diaspora-blue to-diaspora-darkBlue text-white">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                {isEditMode && (
                  <div className="grid gap-1 text-center">
                    <Label
                      htmlFor="profile-picture"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Change photo
                    </Label>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-sm text-gray-600 max-w-[140px] mx-auto"
                      aria-label="Upload profile picture"
                    />
                    <p className="text-xs text-gray-500">JPEG, PNG, max 5MB</p>
                  </div>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {isEditMode ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="full-name" className="text-sm font-medium text-gray-800">Full Name</Label>
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="John Doe"
                        value={profile.full_name || ""}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        required
                        className="border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-800">Email</Label>
                      <Input id="email" type="email" value={profile.email || ""} disabled className="bg-gray-100" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-800">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date-of-birth" className="text-sm font-medium text-gray-800">Date of Birth</Label>
                      <Input
                        id="date-of-birth"
                        type="date"
                        value={profile.date_of_birth || ""}
                        onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                        className="border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-800">Address</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="123 Main St, City, State, ZIP"
                        value={profile.address || ""}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label className="text-sm font-medium text-gray-800">Current location</Label>
                      <Input type="text" value={locationDisplay} disabled className="bg-gray-100" />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label className="text-sm font-medium text-gray-800 flex items-center gap-2"><XLogo className="h-4 w-4" /> Profile</Label>
                      <Input type="text" value={profile.x_link || ""} className="border-gray-300 focus:ring-blue-500" placeholder="Enter X Profile Url" onChange={(e) => handleInputChange("x_link", e.target.value)} />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label className="text-sm font-medium text-gray-800 flex items-center gap-2"><Globe className="w-4 h-4" /> Website</Label>
                      <Input type="text" value={profile.website || ""} className="border-gray-300 focus:ring-blue-500" placeholder="Enter website URL" onChange={(e) => handleInputChange("website", e.target.value)} />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label className="text-sm font-medium text-gray-800 flex items-center gap-2"><Linkedin className="w-4 h-4" /> Profile</Label>
                      <Input type="text" value={profile.linkedin_link || ""} className="border-gray-300 focus:ring-blue-500" placeholder="Enter Linkedin Profile Url" onChange={(e) => handleInputChange("linkedin_link", e.target.value)} />
                    </div>

                  </>
                ) : (
                  <>
                    <div className="grid gap-1">
                      <span className="text-sm text-gray-500">Full Name</span>
                      <p className="font-medium text-gray-900">{profile.full_name || "—"}</p>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-sm text-gray-500">Email</span>
                      <p className="font-medium text-gray-900">{profile.email || "—"}</p>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-sm text-gray-500">Phone</span>
                      <p className="font-medium text-gray-900">{profile.phone || "—"}</p>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-sm text-gray-500">Date of Birth</span>
                      <p className="font-medium text-gray-900">
                        {profile.date_of_birth ? format(new Date(profile.date_of_birth), "PPP") : "—"}
                      </p>
                    </div>

                    <div className="grid gap-1 md:col-span-2">
                      <span className="text-sm text-gray-500">Address</span>
                      <p className="font-medium text-gray-900">{profile.address || "—"}</p>
                    </div>
                    <div className="grid gap-1 md:col-span-2">
                      <span className="text-sm text-gray-500">Current location</span>
                      <p className="font-medium text-gray-900">{locationDisplay}</p>
                    </div>

                    {(profile.x_link || profile.linkedin_link || profile.website) && (
                      <div className="md:col-span-2 flex flex-wrap gap-x-8 gap-y-3 mt-3">
                        {profile.x_link && (
                          <div className="grid gap-1">
                            <span className="text-sm text-gray-500 flex items-center gap-2">
                              <XLogo className="h-4 w-4" /> Profile
                            </span>
                            <a href={profile.x_link} target="_blank" rel="noopener noreferrer" className="text-xs text-diaspora-darkBlue">
                              {truncate(profile.x_link, 30)}
                            </a>
                          </div>
                        )}
                        {profile.linkedin_link && (
                          <div className="grid gap-1">
                            <span className="text-sm text-gray-500 flex items-center gap-2">
                              <Linkedin className="w-4 h-4" /> Profile
                            </span>
                            <a href={profile.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-xs text-diaspora-darkBlue">
                              {truncate(profile.linkedin_link, 30)}
                            </a>
                          </div>
                        )}
                        {profile.website && (
                          <div className="grid gap-1">
                            <span className="text-sm text-gray-500 flex items-center gap-2">
                              <Globe className="w-4 h-4" /> Website
                            </span>
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-xs text-diaspora-darkBlue">
                              {truncate(profile.website, 30)}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Anonymous preference — inside Manage your personal */}
            <div className="pt-4 border-t border-gray-200">
              <Label className="text-sm font-medium text-gray-800 block mb-2">
                Show my profile anonymously
              </Label>
              <RadioGroup
                value={isAnonymous ? "yes" : "no"}
                onValueChange={(value) =>
                  setProfile((prev) =>
                    prev ? { ...prev, anonymous: value === "yes" } : null
                  )
                }
                className="flex flex-wrap gap-4"
                aria-label="Anonymous profile"
                disabled={!isEditMode}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="anonymous-no" />
                  <Label htmlFor="anonymous-no" className="text-gray-700 cursor-pointer">
                    No — show my name and photo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="anonymous-yes" />
                  <Label htmlFor="anonymous-yes" className="text-gray-700 cursor-pointer">
                    Yes — keep me anonymous
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-gray-500 mt-1">
                When anonymous, your identity is hidden in public volunteer listings.
              </p>
            </div>
          </section>

          {/* Section: Skills & Availability */}
          <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Skills & availability
            </h3>
            {isEditMode ? (
              <>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-800">Skills & interests</Label>
                  <CheckboxReactHookFormMultiple
                    items={expertiseData}
                    onChange={handleSkillsChange}
                    initialValues={profile.skills || []}
                    aria-label="Select skills and interests"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-800">Availability</Label>
                  <RadioGroup
                    value={availabilityType}
                    onValueChange={(value: "full-time" | "specific-period") => {
                      setAvailabilityType(value);
                      if (value === "full-time") {
                        setAvailabilityStartDate(undefined);
                        setAvailabilityEndDate(undefined);
                      }
                    }}
                    className="flex items-center flex-wrap gap-4"
                    aria-label="Select availability type"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full-time" id="availability-full-time-profile" />
                      <Label htmlFor="availability-full-time-profile" className="text-gray-700">Full-time</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="specific-period" id="availability-specific-period-profile" />
                      <Label htmlFor="availability-specific-period-profile" className="text-gray-700">Specific period</Label>
                    </div>
                  </RadioGroup>
                  {availabilityType === "specific-period" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-gray-800">Start date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal", !availabilityStartDate && "text-gray-500")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {availabilityStartDate ? format(availabilityStartDate, "PPP") : "Pick start date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={availabilityStartDate} onSelect={setAvailabilityStartDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-gray-800">End date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal", !availabilityEndDate && "text-gray-500")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {availabilityEndDate ? format(availabilityEndDate, "PPP") : "Pick end date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={availabilityEndDate} onSelect={setAvailabilityEndDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-1">
                  <span className="text-sm text-gray-500">Skills</span>
                  <p className="text-gray-900">
                    {profile.skills?.length ? profile.skills.map(getLabel).join(", ") : "—"}
                  </p>
                </div>
                <div className="grid gap-1">
                  <span className="text-sm text-gray-500">Availability</span>
                  <p className="text-gray-900">
                    {availabilityType === "full-time"
                      ? "Full-time"
                      : availabilityStartDate && availabilityEndDate
                        ? `${format(availabilityStartDate, "PPP")} – ${format(availabilityEndDate, "PPP")}`
                        : "—"}
                  </p>
                </div>
              </>
            )}
          </section>

          {/* Section: Experience & location preferences */}
          <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Experience & location preferences
            </h3>
            {isEditMode ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="experience" className="text-sm font-medium text-gray-800">Work experience (summary)</Label>
                  <Textarea
                    id="experience"
                    placeholder="Tell us about your previous experience..."
                    value={profile.experience || ""}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    rows={4}
                    className="border-gray-300 focus:ring-blue-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-800">Nationality</Label>
                  <LocationSelects
                    label=""
                    country={profile.origin_country || ""}
                    state={profile.origin_state || ""}
                    lga={profile.origin_lga || ""}
                    onChangeCountry={(value) => {
                      handleInputChange("origin_country", value);
                      handleInputChange("origin_state", "");
                      handleInputChange("origin_lga", "");
                    }}
                    onChangeState={(value) => {
                      handleInputChange("origin_state", value);
                      handleInputChange("origin_lga", "");
                    }}
                    onChangeLga={(value) => handleInputChange("origin_lga", value)}
                    required
                    aria-label="Select country of origin"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-800">Volunteer location preferences</Label>
                  <LocationSelector
                    ref={locationSelectorRef}
                    initialSelected={{
                      selectedCountries: profile.volunteer_countries || [],
                      selectedStates: profile.volunteer_states || [],
                      selectedLgas: profile.volunteer_lgas || [],
                    }}
                    onSelectionChange={handleLocationChange}
                  />
                  {selectedLocationsDisplay}
                  <p className="text-xs text-gray-500">
                    Select preferred countries, states, and LGAs for volunteering.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-1">
                  <span className="text-sm text-gray-500">Experience</span>
                  <p className="text-gray-900 whitespace-pre-wrap">{profile.experience || "—"}</p>
                </div>
                <div className="grid gap-1">
                  <span className="text-sm text-gray-500">Nationality</span>
                  <p className="text-gray-900">
                    {[profile.origin_country, profile.origin_state, profile.origin_lga].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <div className="grid gap-1">
                  <span className="text-sm text-gray-500">Volunteer locations</span>
                  {selectedLocationsDisplay}
                </div>
              </>
            )}
          </section>

          {isEditMode && (
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full sm:w-auto sm:min-w-[200px] bg-gradient-to-r action-btn transition-all"
                disabled={submitting}
                aria-label="Save profile changes"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              {message && (
                <p
                  className={cn(
                    "text-sm",
                    message.isError ? "text-red-600" : "text-green-600"
                  )}
                  aria-live="assertive"
                >
                  {message.text}
                </p>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}