"use client"
import ForgotPasswordPage from "@/parts/forgot-password";
import React, { Suspense } from "react";

const ResetPassword = () => {
  return (
    <div>
      <Suspense>
        <ForgotPasswordPage />
      </Suspense>
    </div>
  );
};

export default ResetPassword;
