"use client";

import { Button } from "@/components/ui/button";
import {
  BlueEmailIcon,
  BlueInfoIcon,
  GreenDoneIcon,
  OrganisationIcon,
  TinyBlueDot,
  YellowClockIcon,
  YellowLoadingIcon,
} from "@/public/icon";
import { CircleAlertIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import Footer from "../landingPage/footer";
import { getUserId } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

// Define interface for Supabase profile response
interface Profile {
  organization_name: string | null;
}

const ApprovalPending = () => {
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getOrganizationName = async () => {
    try {
      setIsLoading(true);
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) {
        throw new Error("Failed to fetch user ID");
      }
      if (userId) {
        const { data, error } = await supabase
          .from("profiles")
          .select("organization_name")
          .eq("id", userId)
          .single();

        if (error) {
          throw new Error("Failed to fetch organization name");
        }
        setOrganizationName(data?.organization_name || "Unknown Organization");
      }
    } catch (err) {
      setError("An error occurred while fetching organization details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getOrganizationName();
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col space-y-8 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6 bg-white border rounded-lg p-6 shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col justify-center items-center space-y-4 text-center">
          <YellowClockIcon aria-hidden="true" />
          <h2 className="font-semibold text-[#0C4A6E] text-xl">Diasporabase</h2>
          <h1 className="text-2xl font-bold text-gray-900">
            Application Submitted
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md">
            Thank you for your interest in registering as an agency. Your
            application is now under review by our team.
          </p>
          <Button
            className="bg-[#F0F9FF] hover:bg-[#EFF6FF] text-[#0C4A6E] border rounded-lg px-4 py-2"
            disabled={isLoading}
          >
            <OrganisationIcon aria-hidden="true" />
            {isLoading ? "Loading..." : organizationName || "Organization Name"}
          </Button>
          {error && (
            <p className="text-red-500 text-sm" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Status Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Application Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
              <GreenDoneIcon aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Application Submitted
                </h4>
                <span className="text-xs text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
              <YellowLoadingIcon aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Under Review
                </h4>
                <span className="text-xs text-gray-500">
                  1 - 3 business days
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
              <CircleAlertIcon
                className="w-6 h-6 mt-0.5 flex-shrink-0 text-yellow-500"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Approval Decision
                </h4>
                <span className="text-xs text-gray-500">
                  Email Notification
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next Section */}
        <div className="bg-[#EFF6FF] rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BlueInfoIcon aria-hidden="true" />
            <h4 className="text-lg font-semibold text-[#0C4A6E]">
              What Happens Next?
            </h4>
          </div>
          <div className="space-y-3 ml-6">
            <div className="flex items-start gap-2">
              <TinyBlueDot aria-hidden="true" />
              <span className="text-sm text-gray-700 leading-relaxed">
                Our team will verify your organization details
              </span>
            </div>
            <div className="flex items-start gap-2">
              <TinyBlueDot aria-hidden="true" />
              <span className="text-sm text-gray-700 leading-relaxed">
                We may contact you for additional information
              </span>
            </div>
            <div className="flex items-start gap-2">
              <TinyBlueDot aria-hidden="true" />
              <span className="text-sm text-gray-700 leading-relaxed">
                You&apos;ll receive an email with the decision
              </span>
            </div>
            <div className="flex items-start gap-2">
              <TinyBlueDot aria-hidden="true" />
              <span className="text-sm text-gray-700 leading-relaxed">
                If approved, you can access your agency dashboard
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with spacing */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default ApprovalPending;