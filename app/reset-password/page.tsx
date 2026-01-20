"use client"
import ResetPasswordForm from "@/parts/reset-password";
import React, { Suspense } from "react";

const ResetPassword = () => {
  return (
    <div>
      {/* <Suspense> */}
        <ResetPasswordForm />
      {/* </Suspense> */}
    </div>
  );
};

export default ResetPassword;
