"use client";
import React, { ReactNode } from "react";

interface OnboardingLayoutProps {
  children: ReactNode;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
      style={{
        background:
          "linear-gradient(90deg, rgba(14, 165, 233, 0.7) 0%, rgba(59, 7, 100, 0.7) 100%), url('https://diasporabase.com/About.PNG') no-repeat center/cover",
      }}
    >
      <main className="w-full">
        {children}
      </main>
    </div>
  );
};

export default OnboardingLayout;
