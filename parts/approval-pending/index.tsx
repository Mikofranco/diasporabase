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
import React from "react";
import Footer from "../landingPage/footer";

const ApprovalPending = () => {
  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col space-y-8 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6 bg-white border rounded-lg p-6 shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col justify-center items-center space-y-4 text-center">
          <YellowClockIcon />
          <h2 className="font-semibold text-[#0C4A6E] text-xl">Diasporabase</h2>
          <h1 className="text-2xl font-bold text-gray-900">Application Submitted</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md">
            Thank you for your interest in registering as an agency. Your
            application is now under review by our team.
          </p>
          <Button className="bg-[#F0F9FF] hover:bg-[#EFF6FF] text-[#0C4A6E] border rounded-lg px-4 py-2">
            <OrganisationIcon  /> Green Health Organisation
          </Button>
        </div>

        {/* Status Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
              <GreenDoneIcon  />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-medium text-gray-900">Application Submitted</h4>
                <span className="text-xs text-gray-500">January 15, 2025</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
              <YellowLoadingIcon />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-medium text-gray-900">Under Review</h4>
                <span className="text-xs text-gray-500">1 - 3 business days</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
              <CircleAlertIcon className="w-6 h-6 mt-0.5 flex-shrink-0 text-yellow-500"/>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-medium text-gray-900">Approval Decision</h4>
                <span className="text-xs text-gray-500">Email Notification</span>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next Section */}
        <div className="bg-[#EFF6FF] rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BlueInfoIcon/>
            <h4 className="text-lg font-semibold text-[#0C4A6E]">What Happens Next?</h4>
          </div>
          <div className="space-y-3 ml-6">
            <div className="flex items-start gap-2">
              <TinyBlueDot />
              <span className="text-sm text-gray-700 leading-relaxed">
                Our team will verify your organization details
              </span>
            </div>
            <div className="flex items-start gap-2">
              <TinyBlueDot  />
              <span className="text-sm text-gray-700 leading-relaxed">
                We may contact you for additional information
              </span>
            </div>
            <div className="flex items-start gap-2">
              <TinyBlueDot/>
              <span className="text-sm text-gray-700 leading-relaxed">
                You'll receive an email with the decision
              </span>
            </div>
            <div className="flex items-start gap-2">
              <TinyBlueDot/>
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