// app/auth/success/agency/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getFirstTwoWordsShort } from "@/lib/utils";

export default function AuthSuccessAgency() {
  const router = useRouter();
  const [status, setStatus] = useState("Setting up your agency account...");

  useEffect(() => {
    const convertToAgency = async () => {
      try {
        // 1. Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("No authenticated user after redirect");
        }

        const userId = user.id;

        // 2. Update existing profile → change role to agency
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            role: "agency",
            updated_at: new Date().toISOString(),
            // Optional: carry over any Google metadata if useful
            full_name: getFirstTwoWordsShort(user.user_metadata?.full_name) ?? null,
            profile_picture: user.user_metadata?.avatar_url ?? null,
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Profile update failed:", updateError);
          throw updateError;
        }

        // 3. Fetch the (now updated) profile to check completion status
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("role, tax_id, organization_name") 
          .eq("id", userId)
          .single();

        if (fetchError || !profile) {
          console.error("Could not read profile after update:", fetchError);
          throw new Error("Profile not found after update");
        }

        // 4. Decide next step
        setStatus("Preparing your agency onboarding form...");

        const isOnboarded =
          profile.tax_id?.trim() &&
          profile.organization_name?.trim(); 

        if (isOnboarded) {
          router.replace("/dashboard/agency");
        } else {
          router.replace("/onboarding/agency");
        }
      } catch (err: any) {
        console.error("Agency setup error:", err);
        setStatus("Something went wrong. Please try again.");
        setTimeout(() => router.replace("/login?error=agency_setup_failed"), 4000);
      }
    };

    convertToAgency();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-diaspora-blue mx-auto"></div>
        <h2 className="text-2xl font-semibold text-diaspora-blue">{status}</h2>
        <p className="text-muted-foreground max-w-md">
          Almost there — we're converting your account to an agency profile.
        </p>
      </div>
    </div>
  );
}