// components/profile-picture-section.tsx
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Camera, User, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useState, useRef } from "react";

interface ProfilePictureSectionProps {
  initialSrc?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  userId: string;
  onUploadSuccess?: (newUrl: string) => void;
}

const sizeClasses = { sm: "w-20 h-20", md: "w-32 h-32", lg: "w-40 h-40", xl: "w-48 h-48" };
const iconSizes = { sm: "h-12 w-12", md: "h-16 w-16", lg: "h-20 w-20", xl: "h-24 w-24" };
const containerPadding = { sm: "p-4", md: "p-6", lg: "p-8", xl: "p-10" };

export default function ProfilePictureSection({
  initialSrc,
  alt = "Profile picture",
  size = "lg",
  className,
  userId,
  onUploadSuccess,
}: ProfilePictureSectionProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialSrc || null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null); // For new selection preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImage = !!imageSrc;
  const hasPreview = !!previewSrc;

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);

    // Reset input for future selections
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        if (uploadError.message.includes("Duplicate")) {
          toast.info("Image already exists, updating URL...");
        } else {
          throw uploadError;
        }
      }

      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(fileName);

      const newUrl = urlData.publicUrl;

      setImageSrc(newUrl);
      setPreviewSrc(null);
      setSelectedFile(null);
      onUploadSuccess?.(newUrl);

      toast.success("Profile picture updated!");
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error("Failed to upload image. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelPreview = () => {
    setPreviewSrc(null);
    setSelectedFile(null);
  };

  const displaySrc = hasPreview ? previewSrc : imageSrc;

  return (
    <div
      className={cn(
        "bg-muted/50 rounded-xl flex flex-col items-center gap-6 transition-all",
        containerPadding[size],
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />

      {/* Image Display */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden ring-4 ring-background shadow-xl group cursor-pointer",
          sizeClasses[size]
        )}
        onClick={triggerFileInput}
        role="button"
        tabIndex={0}
        aria-label="Change profile picture"
        onKeyDown={(e) => e.key === "Enter" && triggerFileInput()}
      >
        {displaySrc ? (
          <Image
            src={displaySrc}
            alt={alt}
            width={192}
            height={192}
            className="object-cover w-full h-full"
            priority
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-muted">
            <User className={cn("text-muted-foreground", iconSizes[size])} />
          </div>
        )}

        {/* Hover Overlay - only if not in preview mode */}
        {!hasPreview && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
            <Camera className="h-10 w-10 mb-2" />
            <span className="text-sm font-medium">Change Picture</span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Upload className="h-10 w-10 animate-pulse text-white" />
          </div>
        )}
      </div>

      {/* Info Text */}
      <div className="text-center max-w-xs">
        <p className="text-sm font-medium text-foreground">Profile Picture</p>
        <p className="text-xs text-muted-foreground mt-1">
          Square image, at least 400×400px, max 5MB
        </p>
      </div>

      {/* Action Buttons */}
      {hasPreview ? (
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={cancelPreview} disabled={isLoading}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={uploadImage} disabled={isLoading}>
            {isLoading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                Upload Picture
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          onClick={triggerFileInput}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Change Picture
        </Button>
      )}
    </div>
  );
}