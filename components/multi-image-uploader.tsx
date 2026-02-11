// components/MultipleImageUploader.tsx
import React, { useState, ChangeEvent, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'deozddqbr';
const UPLOAD_PRESET = 'documents_upload';
const MAX_MULTIPLE_SIZE_PER_IMAGE = 5 * 1024 * 1024; // 5MB

export interface MultipleImageUploaderRef {
  upload: () => Promise<string[]>;
  clear: () => void;
}

interface MultipleImageUploaderProps {
  onFilesChange?: (files: File[]) => void;
  onUploadComplete?: (urls: string[]) => void;
}

const MultipleImageUploader = forwardRef<MultipleImageUploaderRef, MultipleImageUploaderProps>(
  ({ onFilesChange, onUploadComplete }, ref) => {
    const [previews, setPreviews] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;

      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const invalidMessages: string[] = [];

      selectedFiles.forEach(file => {
        if (!file.type.startsWith('image/')) {
          invalidMessages.push(`${file.name} (not an image)`);
          return;
        }
        if (file.size > MAX_MULTIPLE_SIZE_PER_IMAGE) {
          invalidMessages.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB — max 5MB)`);
          return;
        }
        validFiles.push(file);
      });

      if (invalidMessages.length > 0) {
        setError(`Skipped invalid files:\n${invalidMessages.join('\n')}`);
      } else {
        setError(null);
      }

      if (validFiles.length > 0) {
        const newPreviews = validFiles.map(f => URL.createObjectURL(f));
        setFiles(prev => [...prev, ...validFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);
        onFilesChange?.([...files, ...validFiles]);
      }
    };

    const removeImage = (index: number) => {
      URL.revokeObjectURL(previews[index]);
      setPreviews(prev => prev.filter((_, i) => i !== index));
      setFiles(prev => prev.filter((_, i) => i !== index));
      onFilesChange?.(files.filter((_, i) => i !== index));
    };

    const clear = () => {
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);
      setFiles([]);
      setError(null);
      onFilesChange?.([]);
    };

    const upload = async (): Promise<string[]> => {
      if (files.length === 0) return [];

      try {
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', UPLOAD_PRESET);

          const res = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            formData
          );
          return res.data.secure_url;
        });

        const urls = await Promise.all(uploadPromises);
        onUploadComplete?.(urls);
        return urls;
      } catch (err) {
        console.error(err);
        setError('Upload failed');
        return [];
      }
    };

    useImperativeHandle(ref, () => ({
      upload,
      clear,
    }));

    return (
      <div className="w-full max-w-3xl mx-auto p-5 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="text-lg font-medium text-foreground mb-4">
          Upload Multiple Images (max 5MB each)
        </h3>

        <label className="flex flex-col items-center justify-center px-6 py-10 border-2 border-dashed border-muted-foreground/50 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer mb-6">
          <div className="text-center space-y-2">
            <svg className="mx-auto h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-foreground">Click to select images or drag & drop</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP • Max 5MB per image</p>
          </div>
          <input type="file" accept="image/*" multiple onChange={handleFilesChange} className="hidden" />
        </label>

        {previews.length > 0 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/40">
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-90 hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={clear}
                className="px-5 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-destructive whitespace-pre-line text-center">{error}</p>}
      </div>
    );
  }
);

MultipleImageUploader.displayName = 'MultipleImageUploader';

export default MultipleImageUploader;