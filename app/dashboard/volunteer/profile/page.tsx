"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
import { Loader2, CalendarIcon, User } from "lucide-react";
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
import { cn, getUserLocation } from "@/lib/utils";
import { toast } from "sonner";
import { expertiseData } from "@/data/expertise";
import LocationSelector from "@/components/location-selector";

interface SelectedLocation {
  country: string;
  states: string[];
  lgas: string[];
}

interface ProfileData {
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
}

export default function VolunteerProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [imagePreview, setImagePreview] =  useState<File | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<
    SelectedLocation[]
  >([]);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfileAndLocation = async () => {
      setLoading(true);

      // Fetch user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error fetching user:", userError);
        setMessage({ text: "Please log in to view your profile.", isError: true });
        setLoading(false);
        return;
      }

      setUserEmail(user.email);
      setUserPhone(user.phone || null);

      // Fetch profile
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, email, phone, date_of_birth, address, skills, availability, experience, residence_country, residence_state, origin_country, origin_state, origin_lga, volunteer_countries, volunteer_states, volunteer_lgas, profile_picture"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setMessage({ text: "Failed to load profile data.", isError: true });
        setLoading(false);
        return;
      }

      // Set profile data
      const profileData = {
        ...data,
        skills: data.skills || [],
        volunteer_countries: data.volunteer_countries || [],
        volunteer_states: data.volunteer_states || [],
        volunteer_lgas: data.volunteer_lgas || [],
        profile_picture: data.profile_picture || null,
      };
      setProfile(profileData);
      setSelectedSkill(data.skills || []);
      setImagePreview(data.profile_picture || null);

      if (data.availability === "full-time") {
        setAvailabilityType("full-time");
        setAvailabilityStartDate(undefined);
        setAvailabilityEndDate(undefined);
      } else if (data.availability) {
        try {
          const parsedAvailability = JSON.parse(data.availability);
          setAvailabilityType("specific-period");
          setAvailabilityStartDate(
            parsedAvailability.startDate ? new Date(parsedAvailability.startDate) : undefined
          );
          setAvailabilityEndDate(
            parsedAvailability.endDate ? new Date(parsedAvailability.endDate) : undefined
          );
        } catch (e) {
          console.error("Error parsing availability dates:", e);
          setAvailabilityType("full-time");
          setAvailabilityStartDate(undefined);
          setAvailabilityEndDate(undefined);
        }
      }

      // Fetch and apply location
      try {
        const location = await getUserLocation();
        if (location) {
          const selectedLocation = {
            country: location.country || "Unknown",
            states: location.region ? [location.region] : [],
            lgas: location.city ? [location.city] : [],
          };
          setSelectedLocations([selectedLocation]);
          console.log("Location fetched and set for volunteer preferences:", selectedLocation);

          setProfile(prev => {
            if (!prev) return profileData; // Use fetched profile data if prev is null
            return {
              ...prev,
              residence_country: location.country || prev.residence_country || "Unknown",
              residence_state: location.region || prev.residence_state || "Unknown",
            };
          });
          console.log("Profile updated with residence location:", {
            residence_country: location.country,
            residence_state: location.region,
          });
        } else {
          console.warn("No location data returned from getUserLocation");
        }
      } catch (error) {
        console.error("Error fetching user location:", error);
      }

      setLoading(false);
    };

    fetchProfileAndLocation();
  }, [supabase]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {//@ts-ignore
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
      setMessage({ text: "No profile data to save.", isError: true });
      setSubmitting(false);
      return;
    }

    // Validate availability
    if (
      availabilityType === "specific-period" &&
      (!availabilityStartDate || !availabilityEndDate)
    ) {
      setMessage({
        text: "Please select both a start and end date for your availability period.",
        isError: true,
      });
      setSubmitting(false);
      return;
    }
    if (
      availabilityType === "specific-period" &&
      availabilityStartDate &&
      availabilityEndDate &&
      availabilityStartDate > availabilityEndDate
    ) {
      setMessage({
        text: "Start date cannot be after end date.",
        isError: true,
      });
      setSubmitting(false);
      return;
    }

    // Validate volunteer locations
    if (selectedLocations.length === 0) {
      setMessage({
        text: "Please select at least one volunteer location preference.",
        isError: true,
      });
      setSubmitting(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setMessage({
        text: "Authentication error. Please log in again.",
        isError: true,
      });
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
        setMessage({
          text: "Failed to upload profile picture.",
          isError: true,
        });
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

    const volunteerCountries = selectedLocations.map((loc) => loc.country);
    const volunteerStates = selectedLocations.flatMap((loc) => loc.states);
    const volunteerLgas = selectedLocations.flatMap((loc) => loc.lgas);

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
        volunteer_countries: volunteerCountries.length > 0 ? volunteerCountries : null,
        volunteer_states: volunteerStates.length > 0 ? volunteerStates : null,
        volunteer_lgas: volunteerLgas.length > 0 ? volunteerLgas : null,
        email: user.email,
        profile_picture: profilePictureUrl,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      setMessage({
        text: `Failed to update profile: ${error.message}`,
        isError: true,
      });
    } else {
      toast.success("Profile updated successfully!");
      router.refresh();
      setMessage({ text: "Profile updated successfully!", isError: false });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h3 className="text-2xl font-bold tracking-tight">
            Loading Profile...
          </h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your data.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Profile Not Found
          </h3>
          <p className="text-sm text-muted-foreground">
            Could not load your profile data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Combine residence_country and residence_state for display
  const locationDisplay = [profile.residence_country, profile.residence_state]
    .filter(Boolean)
    .join(", ") || "Unknown";

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Volunteer Profile</CardTitle>
        <CardDescription>
          Manage your personal information and skills.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6" aria-live="polite">
          {/* Profile Picture Section */}
          <div className="grid gap-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted">
                {imagePreview ? (
                  <img//@ts-ignore
                    src={imagePreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <p className="text-sm text-muted-foreground">
                  Upload a profile picture (JPEG, PNG, max 5MB)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                placeholder="John Doe"
                value={profile.full_name || ""}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={userEmail || ""}
                value={profile.email || ""}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={userPhone || ""}
                value={profile.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-of-birth">Date of Birth</Label>
              <Input
                id="date-of-birth"
                type="date"
                value={profile.date_of_birth || ""}
                onChange={(e) =>
                  handleInputChange("date_of_birth", e.target.value)
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main St, City, State, ZIP"
              value={profile.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              value={locationDisplay}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="grid gap-2">
            <Label>Skills & Interests</Label>
            <CheckboxReactHookFormMultiple
              items={expertiseData}
              onChange={handleSkillsChange}
              initialValues={profile.skills || []}
            />
          </div>

          <div className="grid gap-2">
            <Label>Availability</Label>
            <RadioGroup
              value={availabilityType}
              onValueChange={(value: "full-time" | "specific-period") => {
                setAvailabilityType(value);
                if (value === "full-time") {
                  setAvailabilityStartDate(undefined);
                  setAvailabilityEndDate(undefined);
                }
              }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="full-time"
                  id="availability-full-time-profile"
                />
                <Label htmlFor="availability-full-time-profile">
                  Full-time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="specific-period"
                  id="availability-specific-period-profile"
                />
                <Label htmlFor="availability-specific-period-profile">
                  Specific Period
                </Label>
              </div>
            </RadioGroup>
            {availabilityType === "specific-period" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="start-date-profile">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !availabilityStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availabilityStartDate ? (
                          format(availabilityStartDate, "PPP")
                        ) : (
                          <span>Pick a start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={availabilityStartDate}
                        onSelect={setAvailabilityStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date-profile">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !availabilityEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availabilityEndDate ? (
                          format(availabilityEndDate, "PPP")
                        ) : (
                          <span>Pick an end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={availabilityEndDate}
                        onSelect={setAvailabilityEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="experience">Previous Volunteer Experience</Label>
            <Textarea
              id="experience"
              placeholder="Tell us about your previous volunteer experience..."
              value={profile.experience || ""}
              onChange={(e) => handleInputChange("experience", e.target.value)}
              rows={3}
            />
          </div>

          <LocationSelects
            label="Country of Origin"
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
          />

          <div className="grid gap-2">
            <Label>Volunteer Location Preferences</Label>
            <LocationSelector onSelectionChange={setSelectedLocations} />
            <p className="text-sm text-muted-foreground">
              Select your preferred countries, states, and LGAs for volunteering.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full action-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>

          {message && (
            <p
              className={`text-center text-sm ${
                message.isError ? "text-red-500" : "text-green-500"
              }`}
              aria-live="assertive"
            >
              {message.text}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}