import { Progress } from "@/components/ui/progress";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mt-4">
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
        <Progress
          value={progress}
          className="h-full bg-transparent transition-all duration-500 ease-out"
          indicatorClassName="bg-[#0ea5e9]"
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium text-white drop-shadow-sm">
        <span>Skills</span>
        <span>Availability</span>
        <span>Location</span>
      </div>
    </div>
  );
}