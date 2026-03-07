"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { StepIndicator } from "./stepIndicator";
import LocationSelector, {
  LocationSelectorHandle,
  SelectedData,
} from "@/components/location-selector";
import SkillsSelector, {
  SkillsSelectorHandle,
  SelectedSkillsData,
} from "@/components/skill-selector";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { routes } from "@/lib/routes";
// import { LocationSelectorHandle, SelectedData } from "@/app/dashboard/volunteer/profile/page";

// Resolve a selected id (category, subcategory, or skill) to its label from expertiseData
function getLabelForSkillId(id: string): string {
  for (const cat of expertiseData) {
    if (cat.id === id) return cat.label;
    for (const sub of cat.children) {
      if (sub.id === id) return sub.label;
      for (const skill of sub.subChildren) {
        if (skill.id === id) return skill.label;
      }
    }
  }
  return id;
}

// True if id is a leaf skill (appears in some sub.subChildren), not a category or subcategory
function isLeafSkillId(id: string): boolean {
  for (const cat of expertiseData) {
    for (const sub of cat.children) {
      if (sub.subChildren.some((s) => s.id === id)) return true;
    }
  }
  return false;
}

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
  const watchedSkills = watch("skills");

  // When returning to step 1, sync SkillsSelector with form's existing selection
  useEffect(() => {
    if (step === 1 && watchedSkills?.length > 0 && skillsSelectorRef.current) {
      skillsSelectorRef.current.setSelected({
        selectedCategories: [],
        selectedSubCategories: [],
        selectedSkills: watchedSkills,
      });
    }
  }, [step]);

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

  const handleRemoveSkill = useCallback(
    (idToRemove: string) => {
      const next = (watchedSkills ?? []).filter((id) => id !== idToRemove);
      setValue("skills", next, { shouldValidate: true });
      queueMicrotask(() => {
        skillsSelectorRef.current?.setSelected({
          selectedCategories: [],
          selectedSubCategories: [],
          selectedSkills: next,
        });
      });
    },
    [watchedSkills, setValue]
  );

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

      <div className="rounded-2xl border-0 bg-white shadow-xl overflow-hidden max-h-[calc(100vh-17rem)] flex flex-col">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Step 1: Skills — same 3-layer expand/checkbox UX as agency create-project */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Your Skills
              </h2>
              <p className="text-sm text-gray-600">
                Expand categories and subcategories, then select the skills that match your expertise.
              </p>
              <SkillsSelector
                ref={skillsSelectorRef}
                onSelectionChange={(data: SelectedSkillsData) => {
                  // Only store leaf skills (3rd level), not categories or subcategories
                  setValue("skills", data.selectedSkills, { shouldValidate: true });
                }}
              />
              {/* Selected skills display — only leaf skills are stored */}
              {(() => {
                const displayedSkills = watchedSkills ?? [];
                return displayedSkills.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Selected ({displayedSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {displayedSkills.map((id, index) => (
                        <Badge
                          key={`${id}-${index}`}
                          variant="secondary"
                          className="text-gray-800 text-xs pl-2 pr-1 py-0.5 rounded-full gap-1 inline-flex items-center"
                        >
                          <span>{getLabelForSkillId(id)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(id)}
                            className="rounded-full p-0.5 hover:bg-gray-300/80 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            aria-label={`Remove ${getLabelForSkillId(id)}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
              {errors.skills && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.skills.message}
                </p>
              )}
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
