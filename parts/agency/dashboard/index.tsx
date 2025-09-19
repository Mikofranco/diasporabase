"use client";
import Notifications from "@/components/NotificationPanel";
import { supabase } from "@/lib/supabase/client";
import { checkIfAgencyIsActive, getUserId } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const AgencyDashboard = () => {
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const router = useRouter();

  async function fetchUserStatus() {
    try {
      const { data: userData, error: userError } = await getUserId();
      if (userError || !userData) {
        toast.error(userError?.message || "Failed to fetch user ID");
        return null;
      }

      const { data: fetchedData, error: fetchedDataError } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", userData)
        .single();

      if (fetchedDataError) {
        toast.error(fetchedDataError.message || "Failed to fetch user status");
        return null;
      }

      return fetchedData;
    } catch (error) {
      toast.error("An unexpected error occurred");
      return null;
    }
  }

  useEffect(() => {
    async function loadUserStatus() {
      const statusFetched = await fetchUserStatus();
      if (statusFetched) {
        setIsActive(statusFetched.is_active);

        // Example: Redirect if the agency is not active
        if (!statusFetched.is_active) {
          toast.error("Agency is not active");
          router.push("/approval-pending");
        }
      }
    }

    loadUserStatus();
  }, [router]); // Add router to dependency array if used

  return (
    <div>
      <h1>AgencyDashboard</h1>
      {isActive === null ? (
        <p>Loading...</p>
      ) : isActive ? (
        <p>Agency is active</p>
      ) : (
        <p>Agency is inactive</p>
      )}
      <Notifications />
    </div>
  );
};

export default AgencyDashboard;