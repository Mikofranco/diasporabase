"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TOTAL_STEPS } from "./types";
import { useCreateProjectForm } from "./useCreateProjectForm";
import { StepIndicator } from "./StepIndicator";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2LocationDates } from "./steps/Step2LocationDates";
import { Step3CategorySkills } from "./steps/Step3CategorySkills";
import { Step4Documents } from "./steps/Step4Documents";
import type { CreateProjectFormProps } from "./types";

export function CreateProjectForm({ onClose, onProjectCreated }: CreateProjectFormProps) {
  const {
    formData,
    errors,
    serverError,
    loading,
    currentStep,
    documentsError,
    multipleRef,
    skillsSelectorRef,
    handleChange,
    handleSelectChange,
    handleNext,
    handlePrevious,
    onFormSubmit,
    runCreateProject,
    onSkillsChange,
    onDocumentsChange,
  } = useCreateProjectForm(onClose, onProjectCreated);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            title={formData.title}
            description={formData.description}
            errors={errors}
            loading={loading}
            onFieldChange={handleChange}
          />
        );
      case 2:
        return (
          <Step2LocationDates
            country={formData.country}
            state={formData.state}
            lga={formData.lga}
            startDate={formData.start_date}
            endDate={formData.end_date}
            errors={errors}
            loading={loading}
            onFieldChange={handleChange}
            onCountryChange={(v) => handleSelectChange("country", v)}
            onStateChange={(v) => handleSelectChange("state", v)}
            onLgaChange={(v) => handleSelectChange("lga", v)}
          />
        );
      case 3:
        return (
          <Step3CategorySkills
            category={formData.category}
            requiredSkills={formData.required_skills}
            errors={errors}
            loading={loading}
            skillsSelectorRef={skillsSelectorRef}
            onCategoryChange={(v) => handleSelectChange("category", v)}
            onSkillsChange={onSkillsChange}
          />
        );
      case 4:
        return (
          <Step4Documents
            documentsError={documentsError}
            uploaderRef={multipleRef}
            onFilesChange={onDocumentsChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[780px] max-w-[95vw] p-0 max-h-[90vh] overflow-hidden rounded-2xl border-0 shadow-xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col max-h-[90vh]">
          <div className="px-6 pt-5 pb-3 border-b bg-gradient-to-r from-sky-50 to-sky-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-sky-900">
                Create New Project
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 pt-4 pb-6 overflow-y-auto">
            {serverError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                {serverError}
              </div>
            )}

            <StepIndicator currentStep={currentStep} />

            <form onSubmit={onFormSubmit} className="space-y-6">
              {renderStep()}

              <DialogFooter className="flex justify-between mt-8 pt-4 border-t">
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={loading}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
                <div>
                  {currentStep < TOTAL_STEPS ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={loading}
                      className="bg-diaspora-blue hover:bg-diaspora-blue/90 text-white font-semibold rounded-xl px-5 py-2.5 shadow-sm"
                    >
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={runCreateProject}
                      className="bg-diaspora-blue hover:bg-diaspora-blue/90 text-white font-semibold rounded-xl px-5 py-2.5 shadow-sm"
                    >
                      {loading ? "Creating..." : "Create Project"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
