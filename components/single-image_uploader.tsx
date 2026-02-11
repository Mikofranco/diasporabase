// components/SingleImageUploader.tsx
import axios from 'axios';
import React, { useState, ChangeEvent, forwardRef, useImperativeHandle } from 'react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'deozddqbr';
const UPLOAD_PRESET = 'image_upload';
const MAX_SINGLE_SIZE = 2 * 1024 * 1024; // 2MB

export interface SingleImageUploaderRef {
  upload: () => Promise<string | null>;
  clear: () => void;
}

interface SingleImageUploaderProps {
  onFileSelected?: (file: File | null) => void;
  onUploadComplete?: (url: string) => void;
}

const SingleImageUploader = forwardRef<SingleImageUploaderRef, SingleImageUploaderProps>(
  ({ onFileSelected, onUploadComplete }, ref) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      setError(null);

      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];

        if (!selectedFile.type.startsWith('image/')) {
          setError('Only image files are allowed');
          return;
        }

        if (selectedFile.size > MAX_SINGLE_SIZE) {
          setError(`File too large. Max 2MB (your file: ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB)`);
          return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        onFileSelected?.(selectedFile);
      }
    };

    const clear = () => {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setFile(null);
      setError(null);
      onFileSelected?.(null);
    };

    const upload = async (): Promise<string | null> => {
      if (!file) return null;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      try {
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          formData
        );
        const url = res.data.secure_url;
        onUploadComplete?.(url);
        return url;
      } catch (err) {
        console.error(err);
        setError('Upload failed');
        return null;
      }
    };

    // Expose upload and clear methods to parent via ref
    useImperativeHandle(ref, () => ({
      upload,
      clear,
    }));

    return (
      <div className="w-full max-w-md mx-auto p-5 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="text-lg font-medium text-foreground mb-4">
          Upload Image (max 2MB)
        </h3>

        {preview ? (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/40 group">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white text-sm font-medium">Preview</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={clear}
                className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Remove Image
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center px-6 py-10 border-2 border-dashed border-muted-foreground/50 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="text-center space-y-2">
              <svg className="mx-auto h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-foreground">Click to select image or drag & drop</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP • Max 2MB</p>
            </div>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        )}

        {error && <p className="mt-3 text-sm text-destructive text-center">{error}</p>}
      </div>
    );
  }
);

SingleImageUploader.displayName = 'SingleImageUploader';

export default SingleImageUploader;