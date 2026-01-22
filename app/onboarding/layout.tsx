"use client";
import BackButton from "@/components/back-button";
import React, { ReactNode } from "react";

interface OnboardingLayoutProps {
  children: ReactNode;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
      style={{
        backgroundImage: `
      linear-gradient(to bottom, rgba(14, 165, 233, 0.4), rgba(59, 7, 100, 0.8)),
      url('https://jbgnohxjwrvepqnlpccy.supabase.co/storage/v1/object/public/app_images/group-afro-americans-working-together%20(1).jpg')
    `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute top-10 left-10">
        <BackButton />
      </div>
      <main className="w-full">{children}</main>
    </div>
  );
};

export default OnboardingLayout;
