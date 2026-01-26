"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthSuccessAgency() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing login...");
  const [userId, setUserId] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const processLogin = async () => {
      try {
        // Force refresh session (helps in some stuck cases)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user) {
          // If no session yet → wait a bit and retry (race condition fix)
          await new Promise((r) => setTimeout(r, 1500));
          const retry = await supabase.auth.getSession();
          if (!retry.data.session?.user) {
            throw new Error("No session after OAuth redirect");
          }
        }

        const userId = session.user.id;
        console.log("Logged in user ID:", userId);
        setUserId(userId);
      } catch (err) {
        console.error("Login processing error:", err);
        setStatus("Something went wrong. Please try signing in again.");
        setTimeout(() => router.replace("/login?error=auth_failed"), 3000);
      }
    };

    processLogin();
  }, [router]);

  useEffect(() => {
    const finalizeLogin = async () => {
      if (!userId) return;

      try {
        setStatus("Finalizing your login...");

        const {} = await supabase.from("profiles").insert({
          role: "agency"
        }).eq("id")
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, tax_id")
          .eq("id", userId)
          .single();

        if (profileError || !profile) {
          console.error("Profile error:", profileError);
          setStatus("Profile not found – redirecting to setup...");
          router.replace("/onboarding/profile");
          return;
        }

        const role = profile.role;

        setStatus(`Welcome! Redirecting as ${role}...`);

        if (role === 'super_admin' || role === 'admin') {
          router.replace('/dashboard/admin');
        } else if (role === 'agency') {
          if (!profile.tax_id || profile.tax_id.trim() === '') {
            router.replace('/onboarding/agency');
          } else {
            router.replace('/dashboard/agency');
          }
        } else if (role === 'volunteer') {
          router.replace('/dashboard/volunteer');
        } else {
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error("Finalization error:", err);
        setStatus(
          "An error occurred during finalization. Redirecting to login...",
        );
        setTimeout(
          () => router.replace("/login?error=finalization_failed"),
          3000,
        );
      }
    };
    finalizeLogin();
  }, [userId]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-diaspora-blue mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-diaspora-blue">{status}</h2>
        <p className="text-muted-foreground mt-2">
          You will be redirected shortly.
        </p>
      </div>
    </div>
  );
}
