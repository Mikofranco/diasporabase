// app/onboarding/components/StepIndicator.tsx
import { Progress } from "@/components/ui/progress";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span>Step {currentStep} of {totalSteps}</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}