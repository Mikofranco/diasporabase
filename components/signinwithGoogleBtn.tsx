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
    const successUrl =
      role === "agency"
        ? `${window.location.origin}/auth/success/agency`
        : `${window.location.origin}/auth/success`;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: successUrl,
          queryParams: {
            // Optional: helps you distinguish signup vs login in callback
            mode: "signup",
            // Will be available in the /auth/success route via URL search params
            role,
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
        "w-fit flex items-center justify-center gap-3 font-medium border-2 bg-slate-100 text-diaspora-blue hover:bg-white hover:text-primary",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <FcGoogle className="h-6 w-6" />
      )}
      {children ||
        `Sign up with Google as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
    </Button>
  );
}
