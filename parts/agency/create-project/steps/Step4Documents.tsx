"use client";

import MultipleImageUploader, {
  type MultipleImageUploaderRef,
} from "@/components/multi-image-uploader";

interface Step4DocumentsProps {
  documentsError: string | null;
  uploaderRef: React.RefObject<MultipleImageUploaderRef | null>;
  onFilesChange: (files: File[] | undefined) => void;
}

export function Step4Documents({
  documentsError,
  uploaderRef,
  onFilesChange,
}: Step4DocumentsProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Supporting Documents
          <span className="text-xs text-gray-500 font-normal ml-2">
            (Optional)
          </span>
        </h3>
        <p className="text-sm text-gray-600">
          Upload any supporting documents such as CAC certificate, registration
          documents, proposals, or other relevant files (PDF, JPG, PNG). These
          are helpful but not required and you can always add them later after
          creating your project.
        </p>
      </div>
      <MultipleImageUploader
        ref={uploaderRef}
        title=""
        onFilesChange={onFilesChange}
      />
      {documentsError && (
        <p className="text-red-500 text-sm">{documentsError}</p>
      )}
    </div>
  );
}
