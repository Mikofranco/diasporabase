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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckboxReactHookFormMultiple } from "@/components/renderedItems";
import { LocationSelects } from "@/components/location-selects";
import { StepIndicator } from "./stepIndicator";

// Zod schema for onboarding form
const onboardingSchema = z.object({
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  availabilityType: z.enum(["full-time", "specific-period"]),
  availabilityStartDate: z.date().optional(),
  availabilityEndDate: z.date().optional(),
  volunteerCountry: z.string().min(1, "Please select a volunteer country"),
  volunteerState: z.string().optional(),
  volunteerLga: z.string().optional(),
}).refine(
  (data) =>
    data.availabilityType !== "specific-period" ||
    (data.availabilityStartDate && data.availabilityEndDate),
  {
    message: "Please select both start and end dates for specific period availability",
    path: ["availabilityStartDate"],
  }
).refine(
  (data) =>
    data.availabilityType !== "specific-period" ||
    (data.availabilityStartDate && data.availabilityEndDate && data.availabilityStartDate <= data.availabilityEndDate),
  {
    message: "Start date cannot be after end date",
    path: ["availabilityEndDate"],
  }
);

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export function VolunteerOnboardingForm() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const router = useRouter();
  const supabase = createClient();

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
      volunteerCountry: "",
      volunteerState: "",
      volunteerLga: "",
    },
  });

  const availabilityType = watch("availabilityType");

  const onSubmit = async (data: OnboardingFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("User not authenticated");
      router.push("/login");
      return;
    }

    const availabilityToStore =
      data.availabilityType === "full-time"
        ? "full-time"
        : JSON.stringify({
            startDate: data.availabilityStartDate ? format(data.availabilityStartDate, "yyyy-MM-dd") : null,
            endDate: data.availabilityEndDate ? format(data.availabilityEndDate, "yyyy-MM-dd") : null,
          });

    const updatePayload = {
      skills: data.skills,
      availability: availabilityToStore,
      volunteer_country: data.volunteerCountry,
      volunteer_state: data.volunteerState,
      volunteer_lga: data.volunteerLga,
    };

    const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);

    if (error) {
      alert(`Failed to save onboarding data: ${error.message}`);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    router.push(`/dashboard/${profile?.role || "volunteer"}`);
  };

  const handleNext = () => {
    if (step === 1 && watch("skills").length === 0) {
      alert("Please select at least one skill");
      return;
    }
    if (step === 2 && !watch("availabilityType")) {
      alert("Please select your availability");
      return;
    }
    if (
      step === 2 &&
      watch("availabilityType") === "specific-period" &&
      (!watch("availabilityStartDate") || !watch("availabilityEndDate"))
    ) {
      alert("Please select both start and end dates");
      return;
    }
    if (step === 3 && !watch("volunteerCountry")) {
      alert("Please select a volunteer country");
      return;
    }
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit(onSubmit)();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
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
            //   selected={watch("skills")}
              onChange={(selected) => setValue("skills", selected)}
            />
            {errors.skills && (
              <p className="text-red-500 text-sm">{errors.skills.message}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Select Your Availability</h2>
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
                <RadioGroupItem value="specific-period" id="availability-specific-period" />
                <Label htmlFor="availability-specific-period">Specific Period</Label>
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
                          !watch("availabilityStartDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("availabilityStartDate") ? (//@ts-ignore
                          format(watch("availabilityStartDate"), "PPP")
                        ) : (
                          <span>Pick a start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch("availabilityStartDate")}
                        onSelect={(date) => setValue("availabilityStartDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.availabilityStartDate && (
                    <p className="text-red-500 text-sm">{errors.availabilityStartDate.message}</p>
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
                          !watch("availabilityEndDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("availabilityEndDate") ? (//@ts-ignore
                          format(watch("availabilityEndDate"), "PPP")
                        ) : (
                          <span>Pick an end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch("availabilityEndDate")}
                        onSelect={(date) => setValue("availabilityEndDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.availabilityEndDate && (
                    <p className="text-red-500 text-sm">{errors.availabilityEndDate.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Select Volunteer Location</h2>
            <LocationSelects
              label="Volunteer Location Preference"
              country={watch("volunteerCountry")}//@ts-ignore
              state={watch("volunteerState")}//@ts-ignore
              lga={watch("volunteerLga")}
              onChangeCountry={(value) => {
                setValue("volunteerCountry", value);
                setValue("volunteerState", "");
                setValue("volunteerLga", "");
              }}
              onChangeState={(value) => {
                setValue("volunteerState", value);
                setValue("volunteerLga", "");
              }}
              onChangeLga={(value) => setValue("volunteerLga", value)}
              required
              stateOptional
              lgaOptional
            />
            {errors.volunteerCountry && (
              <p className="text-red-500 text-sm">{errors.volunteerCountry.message}</p>
            )}
          </div>
        )}

 “

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
          >
            {step === totalSteps ? "Complete Onboarding" : "Next"}
          </Button>
        </div>
      </form>
    </div>
  );
}