"use client"
import ResetPasswordPage from "@/parts/reset-password";
import React, { Suspense } from "react";

const ResetPassword = () => {
  return (
    <div>
      <Suspense>
        <ResetPasswordPage />
      </Suspense>
    </div>
  );
};

export default ResetPassword;
