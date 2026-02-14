"use client";

import BackButton from "@/components/back-button";
import React, { ReactNode } from "react";

interface OnboardingLayoutProps {
  children: ReactNode;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
  return (
    <div
      className="relative flex h-screen flex-col items-center overflow-hidden bg-gray-50 px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 58, 138, 0.6) 50%, rgba(59, 7, 100, 0.8) 100%), url('https://jbgnohxjwrvepqnlpccy.supabase.co/storage/v1/object/public/app_images/group-afro-americans-working-together%20(1).jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <style>{`
        .onboarding-scroll::-webkit-scrollbar { width: 8px; }
        .onboarding-scroll::-webkit-scrollbar-track { background: transparent; }
        .onboarding-scroll::-webkit-scrollbar-thumb { border-radius: 4px; background: rgba(255,255,255,0.35); }
        .onboarding-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
      `}</style>
      <div className="absolute left-4 top-6 z-10 sm:left-6 sm:top-8">
        <BackButton size="lg" className="h-11 px-5 rounded-xl font-medium" />
      </div>
      <main
        className="onboarding-scroll w-full max-w-4xl flex-1 min-h-0 overflow-y-auto pt-12 sm:pt-14"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.35) transparent",
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default OnboardingLayout;
