// app/onboarding/components/OnboardingForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { expertiseData } from "@/data/expertise";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckboxReactHookFormMultiple } from "@/components/renderedItems";
import { LocationSelects } from "@/components/location-selects";
import { StepIndicator } from "./stepIndicator";
import LocationSelector from "@/components/location-selector";

interface SelectedLocation {
  country: string;
  states: string[];
  lgas: string[];
}

// Zod schema for onboarding form (unchanged)
const onboardingSchema = z
  .object({
    skills: z.array(z.string()).min(1, "Please select at least one skill"),
    availabilityType: z.enum(["full-time", "specific-period"]),
    availabilityStartDate: z.date().optional(),
    availabilityEndDate: z.date().optional(),
  })
  .refine(
    (data) =>
      data.availabilityType !== "specific-period" ||
      (data.availabilityStartDate && data.availabilityEndDate),
    {
      message:
        "Please select both start and end dates for specific period availability",
      path: ["availabilityStartDate"],
    }
  )
  .refine(
    (data) =>
      data.availabilityType !== "specific-period" ||
      (data.availabilityStartDate &&
        data.availabilityEndDate &&
        data.availabilityStartDate <= data.availabilityEndDate),
    {
      message: "Start date cannot be after end date",
      path: ["availabilityEndDate"],
    }
  );

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export function VolunteerOnboardingForm() {
  const [step, setStep] = useState(1);
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>([]);
  const totalSteps = 3;
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false); // New loading state

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      skills: [],
      availabilityType: "full-time",
      availabilityStartDate: undefined,
      availabilityEndDate: undefined,
    },
  });

  const availabilityType = watch("availabilityType");

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true); // Set loading to true when submission starts
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      router.push("/login");
      return;
    }

    // Defensive: Ensure selectedLocations is always treated as an array
    const safeLocations = Array.isArray(selectedLocations) ? selectedLocations : [];
    const volunteerCountries = safeLocations.map((loc) => loc.country);
    const volunteerStates = safeLocations.flatMap((loc) => loc.states);
    const volunteerLgas = safeLocations.flatMap((loc) => loc.lgas);

    const availabilityToStore =
      data.availabilityType === "full-time"
        ? "full-time"
        : JSON.stringify({
            startDate: data.availabilityStartDate
              ? format(data.availabilityStartDate, "yyyy-MM-dd")
              : null,
            endDate: data.availabilityEndDate
              ? format(data.availabilityEndDate, "yyyy-MM-dd")
              : null,
          });

    const updatePayload = {
      skills: data.skills,
      availability: availabilityToStore,
      volunteer_countries:
        volunteerCountries.length > 0 ? volunteerCountries : null,
      volunteer_states: volunteerStates.length > 0 ? volunteerStates : null,
      volunteer_lgas: volunteerLgas.length > 0 ? volunteerLgas : null,
    };

    // Chain update and select for efficiency
    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)
      .select("role")
      .single();

    if (error) {
      console.error(`Failed to save onboarding data: ${error.message}`);
      // TODO: Use toast.error for production
      return;
    }

    router.push(`/dashboard/${profile?.role || "volunteer"}`);
    setIsLoading(false);
  };

  const handleNext = () => {
    if (step === 1 && watch("skills").length === 0) {
      console.error("Please select at least one skill");
      return;
    }
    if (step === 2 && !watch("availabilityType")) {
      console.error("Please select your availability");
      return;
    }
    if (
      step === 2 &&
      watch("availabilityType") === "specific-period" &&
      (!watch("availabilityStartDate") || !watch("availabilityEndDate"))
    ) {
      console.error("Please select both start and end dates");
      return;
    }
    // Defensive: Use optional chaining and default to empty array
    if (step === 3 && (!selectedLocations || selectedLocations.length === 0)) {
      console.error("Please select at least one volunteer location");
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Also make setSelectedLocations defensive to always receive an array
  const handleLocationsChange = (newValue: SelectedLocation | SelectedLocation[] | undefined) => {
    const asArray = Array.isArray(newValue) ? newValue : newValue ? [newValue] : [];
    setSelectedLocations(asArray);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <StepIndicator currentStep={step} totalSteps={totalSteps} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Select Your Skills</h2>
            <CheckboxReactHookFormMultiple
              items={expertiseData}
              onChange={(selected) => setValue("skills", selected)}
            />
            {errors.skills && (
              <p className="text-red-500 text-sm">{errors.skills.message}</p>
            )}
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Select Your Availability
            </h2>
            <RadioGroup
              value={availabilityType}
              onValueChange={(value: "full-time" | "specific-period") => {
                setValue("availabilityType", value);
                if (value === "full-time") {
                  setValue("availabilityStartDate", undefined);
                  setValue("availabilityEndDate", undefined);
                }
              }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full-time" id="availability-full-time" />
                <Label htmlFor="availability-full-time">Full-time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="specific-period"
                  id="availability-specific-period"
                />
                <Label htmlFor="availability-specific-period">
                  Specific Period
                </Label>
              </div>
            </RadioGroup>
            {availabilityType === "specific-period" && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !(watch("availabilityStartDate") as Date | undefined) &&
                            "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {(watch("availabilityStartDate") as Date | undefined)
                          ? format(watch("availabilityStartDate") as Date, "PPP")
                          : "Pick a start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch("availabilityStartDate")}
                        onSelect={(date) =>
                          setValue("availabilityStartDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.availabilityStartDate && (
                    <p className="text-red-500 text-sm">
                      {errors.availabilityStartDate.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !(watch("availabilityEndDate") as Date | undefined) &&
                            "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {(watch("availabilityEndDate") as Date | undefined)
                          ? format(watch("availabilityEndDate") as Date, "PPP")
                          : "Pick an end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch("availabilityEndDate")}
                        onSelect={(date) =>
                          setValue("availabilityEndDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.availabilityEndDate && (
                    <p className="text-red-500 text-sm">
                      {errors.availabilityEndDate.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Select Volunteer Location
            </h2>
            {/* Pass the defensive handler instead of setSelectedLocations directly */}
            <LocationSelector //@ts-ignore
              onSelectionChange={handleLocationsChange} />
          </div>
        )}
        <div className="flex justify-between mt-6">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
            disabled={
              (step === 1 && watch("skills").length === 0) ||
              (step === 2 && !watch("availabilityType")) ||
              (step === 2 &&
                watch("availabilityType") === "specific-period" &&
                (!watch("availabilityStartDate") || !watch("availabilityEndDate"))) ||
              // Defensive: Use optional chaining here too for the button state
              (step === 3 && (!selectedLocations || selectedLocations.length === 0))
            }
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Submitting...
              </div>
            ) : step === totalSteps ? (
              "Complete Onboarding"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}