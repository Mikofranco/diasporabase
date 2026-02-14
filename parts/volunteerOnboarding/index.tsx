"use client";

import { useCallback, useRef, useState } from "react";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckboxReactHookFormMultiple } from "@/components/renderedItems";
import { StepIndicator } from "./stepIndicator";
import LocationSelector, {
  LocationSelectorHandle,
  SelectedData,
} from "@/components/location-selector";
// import SkillsSelector from "@/components/skill-selector";
import SkillsSelector, {
  SkillsSelectorHandle,
  SelectedSkillsData,
} from "@/components/skill-selector";
import { routes } from "@/lib/routes";
// import { LocationSelectorHandle, SelectedData } from "@/app/dashboard/volunteer/profile/page";

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
      message: "Please select both start and end dates",
      path: ["availabilityStartDate"],
    },
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
    },
  );

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export function VolunteerOnboardingForm() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const locationSelectorRef = useRef<LocationSelectorHandle>(null);

  const [selectedLocations, setSelectedLocations] = useState<SelectedData>({
    selectedCountries: [],
    selectedStates: [],
    selectedLgas: [],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    setError,
    clearErrors,
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
  const skillsSelectorRef = useRef<SkillsSelectorHandle>(null);

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        router.push(routes.login);
        return;
      }

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
          selectedLocations.selectedCountries.length > 0
            ? selectedLocations.selectedCountries
            : null,
        volunteer_states:
          selectedLocations.selectedStates.length > 0
            ? selectedLocations.selectedStates
            : null,
        volunteer_lgas:
          selectedLocations.selectedLgas.length > 0
            ? selectedLocations.selectedLgas
            : null,
      };

      const { data: profile, error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id)
        .select("role")
        .single();

      if (error) {
        console.error(`Failed to save onboarding data: ${error.message}`);
        return;
      }

      router.push(`/${profile?.role === "super_admin" ? "super-admin" : profile?.role || "volunteer"}/dashboard`);
    } catch (err) {
      console.error("Unexpected error during onboarding:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    clearErrors(); // Clear previous errors

    let isValid = true;

    // Step 1: Validate Skills
    if (step === 1) {
      isValid = await trigger("skills");
      if (!isValid) {
        setError("skills", { message: "Please select at least one skill" });
      }
    }

    // Step 2: Validate Availability
    if (step === 2) {
      const fields: (keyof OnboardingFormData)[] = ["availabilityType"];
      if (availabilityType === "specific-period") {
        fields.push("availabilityStartDate", "availabilityEndDate");
      }
      isValid = await trigger(fields);
    }

    // Step 3: Validate Location (external state)
    if (step === 3) {
      if (selectedLocations.selectedCountries.length === 0) {
        isValid = false;
      }
    }

    if (!isValid) return;

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleLocationChange = useCallback((data: SelectedData) => {
    setSelectedLocations(data);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Volunteer Onboarding
        </h1>
        <p className="mt-1 text-sm text-blue-200/90">
          Step {step} of {totalSteps}
        </p>
        <StepIndicator currentStep={step} totalSteps={totalSteps} />
      </div>

      <div className="rounded-2xl border-0 bg-white shadow-xl overflow-hidden max-h-[calc(100vh-14rem)] flex flex-col">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Step 1: Skills */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Your Skills
              </h2>
              <CheckboxReactHookFormMultiple
                items={expertiseData}
                initialValues={watch("skills") ?? []}
                onChange={(selected) => setValue("skills", selected)}
              />
            {errors.skills && (
              <p className="text-red-500 text-sm mt-1">
                {errors.skills.message}
              </p>
            )}

            {/* <SkillsSelector
              ref={skillsSelectorRef}
              onSelectionChange={(data) => {
                // Combine all selected ids into one flat array for your form
                const allSelected = [
                  ...data.selectedCategories,
                  ...data.selectedSubCategories,
                  ...data.selectedSkills,
                ];
                setValue("skills", allSelected, { shouldValidate: true });
              }}
            /> */}
          </div>
        )}

          {/* Step 2: Availability */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
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
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full-time" id="full-time" />
                <Label htmlFor="full-time">Full-time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific-period" id="specific-period" />
                <Label htmlFor="specific-period">Specific Period</Label>
              </div>
            </RadioGroup>

            {availabilityType === "specific-period" && (
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-6">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !watch("availabilityStartDate") &&
                            "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("availabilityStartDate")
                          ? format(
                              watch("availabilityStartDate") as Date,
                              "PPP",
                            )
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.availabilityStartDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !watch("availabilityEndDate") &&
                            "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("availabilityEndDate")
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.availabilityEndDate.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

          {/* Step 3: Location - scrolls inside card (same as Skills); multiple states/LGAs supported */}
          {step === 3 && (
            <div className="space-y-6 min-h-0">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Volunteer Location
              </h2>
              <div className="max-h-[min(55vh,480px)] min-h-0 overflow-y-auto rounded-xl border border-gray-200">
                <LocationSelector
                  ref={locationSelectorRef}
                  initialSelected={selectedLocations}
                  noInternalScroll
                  onSelectionChange={handleLocationChange}
                />
              </div>
              {selectedLocations.selectedCountries.length === 0 && (
                <p className="text-diaspora-blue text-sm mt-2">
                  Choose your volunteer area in Nigeria (LGA, state, or nationwide)
                </p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4 sm:pt-6">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="min-w-[100px] rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back
              </Button>
            )}
            <Button
              type={step === totalSteps ? "submit" : "button"}
              onClick={step < totalSteps ? handleNext : undefined}
              disabled={
                isLoading ||
                (step === 1 && watch("skills").length === 0) ||
                (step === 2 && !availabilityType) ||
                (step === 2 &&
                  availabilityType === "specific-period" &&
                  (!watch("availabilityStartDate") ||
                    !watch("availabilityEndDate"))) ||
                (step === 3 && selectedLocations.selectedCountries.length === 0)
              }
              className={cn(
                "flex-1 min-w-[120px] rounded-xl action-btn font-semibold py-2.5",
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin shrink-0 mr-2" />
                  Submitting...
                </span>
              ) : step === totalSteps ? (
                "Complete Onboarding"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
