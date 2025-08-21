"use client";
import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client"
import { Button } from "../ui/button";
import { MailIcon, RefreshCwIcon } from "lucide-react";
import { Separator } from "../ui/separator";
import { MailIconBlue, RetryIconWhite } from "@/public/icon";


const supabase =createClient();

interface VolunteerCheckMailProps {
  email?: string; 
}

const VolunteerCheckMail: React.FC<VolunteerCheckMailProps> = ({ email: propEmail }) => {
  // Get email from local storage or use prop as fallback
  const email = typeof window !== "undefined" ? localStorage.getItem("diaporabse-email") || propEmail || "something@gmail.com" : "something@gmail.com";
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setSuccess("Verification email resent successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-lg mt-10">
      {/* Header Section */}
      <div className="flex flex-col items-center space-y-4 text-center">
        <Image
          src="/svg/logo.svg"
          alt="DiasporaBase Logo"
          width={60}
          height={60}
          className="rounded-lg shadow-md"
          priority
        />
        <h1 className="text-2xl font-bold text-[#0C4A6E]">DiasporaBase</h1>
        <h2 className="text-xl font-semibold">Check Your Email</h2>
        <p className="text-[16px] text-[#4B5563]">
          We&apos;ve sent a confirmation email to verify your account. Please check
          your inbox and click the verification link to complete your registration.
        </p>
        <div className="flex w-full items-center justify-center gap-2 rounded-lg border bg-[#F0F9FF] p-4 shadow-sm">
          <MailIcon className="h-5 w-5 text-[#075985]" aria-hidden="true" />
          <span className="text-[#075985]">{email}</span>
        </div>
      </div>

      {/* Feedback Messages */}
      {success && (
        <div className="mt-4 rounded-lg bg-green-100 p-3 text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* What's Next Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold">What&apos;s Next?</h3>
        <ul className="mt-2 space-y-2 text-[16px] text-[#4B5563] list-disc pl-6">
          <li>Check your email inbox (and spam/junk folder).</li>
          <li>Click the link in the email to verify your account.</li>
          <li>Once verified, log in and start volunteering!</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        <Button
          onClick={handleResend}
          disabled={isResending}
          className="flex w-full items-center justify-center gap-2 rounded-lg border action-btn py-4 text-white shadow-sm hover:bg-[#E0F0FF] disabled:opacity-50"
          aria-label="Resend verification email"
        >
          <RetryIconWhite/>
          {isResending ? "Resending..." : "Resend Verification Email"}
        </Button>
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={isResending}
          className="flex w-full items-center justify-center gap-2 rounded-lg border bg-white py-4 text-[#0369A1] shadow-sm hover:bg-gray-50 disabled:opacity-50"
          aria-label="Resend verification email (alternative)"
        >
          <MailIconBlue/>
          {isResending ? "Resending..." : "Resend Verification Email"}
        </Button>
      </div>

      {/* Troubleshooting Section */}
      <div className="mt-6">
        <Separator className="my-4" />
        <div className="text-center">
          <h3 className="text-lg font-medium">Didn&apos;t Receive the Email?</h3>
          <ul className="mt-2 space-y-2 text-[16px] text-[#4B5563] list-disc pl-6 text-left">
            <li>Check your spam or junk folder.</li>
            <li>Ensure you entered the correct email address.</li>
            <li>Wait a few minutes and try resending the email.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VolunteerCheckMail;