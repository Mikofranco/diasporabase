// components/auth/GoogleSignUpButton.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface GoogleSignUpButtonProps {
  className?: string;
  children?: React.ReactNode; // Optional: custom text
  role: "volunteer" | "agency"; // Required: sets role in callback
  disabled?: boolean;
}

export function GoogleSignUpButton({
  className,
  children,
  role,
  disabled = false,
}: GoogleSignUpButtonProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    if (disabled || loading) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            mode: "signup",
            role, // Pass role as query param → handled in callback
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Google sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleSignUp}
      disabled={disabled || loading}
      variant="outline"
      className={cn(
        "w-full flex items-center justify-center gap-3 py-6 text-base font-medium border-2",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <FcGoogle className="h-6 w-6" />
        
      )}
      {children || `Sign up with Google as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
    </Button>
  );
}
