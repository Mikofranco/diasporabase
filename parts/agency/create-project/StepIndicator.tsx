"use client";

import { STEP_LABELS, TOTAL_STEPS } from "./types";

const CHECK_ICON = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const stepStyle = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all";
const activeStyle = "bg-[#0284C7] text-white ring-4 ring-[#0284C7]/20";
const doneStyle = "bg-[#0284C7] text-white";
const pendingStyle = "bg-gray-200 text-gray-600";
const connectorStyle = "h-0.5 flex-1 mx-2 mt-5";

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
          <p className="text-sm font-medium text-gray-900">
            {STEP_LABELS[currentStep - 1]}
          </p>
        </div>
      </div>
      <div className="flex justify-between mt-3">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isDone = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          return (
            <div key={label} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`${stepStyle} ${
                      isDone ? doneStyle : isActive ? activeStyle : pendingStyle
                    }`}
                  >
                    {isDone ? CHECK_ICON : stepNum}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      currentStep >= stepNum ? "text-[#0284C7]" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`${connectorStyle} ${
                      isDone ? "bg-[#0284C7]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
