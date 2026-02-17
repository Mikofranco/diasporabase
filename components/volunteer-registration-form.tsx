"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSendMail } from "@/services/mail";
import { welcomeHtml } from "@/lib/email-templates/welcome";
import { encryptUserToJWT } from "@/lib/jwt";
import { GoogleSignUpButton } from "./signinwithGoogleBtn";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsModal, VolunteerTermsContent } from "./terms-modal";
import { routes } from "@/lib/routes";

const formSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

const DEFAULT_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
};

export default function VolunteerRegistrationForm() {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  // Terms agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Modal & Resend state
  const [modalOpen, setModalOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Store confirmation details after successful signup
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    email: string;
    firstName: string;
    confirmationUrl: string;
  } | null>(null);

  const supabase = createClient();

  // Real-time validation
  useEffect(() => {
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof FormData;
        if (path && touched[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
    } else {
      setErrors({});
    }
  }, [formData, touched]);

  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringRef = useRef(false);
  const AUTO_CLOSE_MS = 5000;

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  const startAutoCloseTimer = useCallback(() => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      if (!isHoveringRef.current) handleCloseModal();
      autoCloseTimerRef.current = null;
    }, AUTO_CLOSE_MS);
  }, [handleCloseModal]);

  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (modalOpen) {
      isHoveringRef.current = false;
      startAutoCloseTimer();
    }
    return () => clearAutoCloseTimer();
  }, [modalOpen, startAutoCloseTimer, clearAutoCloseTimer]);

  const handleModalMouseEnter = () => {
    isHoveringRef.current = true;
    clearAutoCloseTimer();
  };

  const handleModalMouseLeave = () => {
    isHoveringRef.current = false;
    startAutoCloseTimer();
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setTouched({});
    setErrors({});
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Mark all fields as touched to show errors
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
    });

    const result = formSchema.safeParse(formData);
    if (!result.success) {
      toast.error("Please fix the errors below");
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const origin = window.location.origin;

      const {
        data: { user },
        error: signUpError,
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: fullName,
            role: "volunteer",
            phone: formData.phone || null,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("Account creation failed");

      // Generate token valid for 24 hours
      const token = await encryptUserToJWT(
        {
          userId: user.id,
          email: user.email!,
          purpose: "email_confirmation",
        },
        "24h", // ← Now 24 hours
      );

      const confirmationUrl = `${origin}${routes.confirmation}?token=${token}`;

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Insert confirmation link record
      await supabase.from("confirmation_links").insert({
        user_id: user.id,
        email: user.email!,
        confirmation_url: confirmationUrl,
        token_hash: token,
        expires_at: expiresAt.toISOString(),
        is_resent: false,
      });

      // Send welcome confirmation email
      await useSendMail({
        to: formData.email,
        subject: "Welcome to DiasporaBase – Confirm Your Email",
        html: welcomeHtml(formData.firstName.trim(), confirmationUrl),
      });

      // Save for resend functionality
      setPendingConfirmation({
        email: formData.email,
        firstName: formData.firstName.trim(),
        confirmationUrl,
      });

      // toast.success("Account created! Please check your email to confirm.");
      setModalOpen(true);
      resetForm();
      localStorage.setItem("diasporabase-email", formData.email);
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend confirmation email
  const handleResend = async () => {
    if (!pendingConfirmation || resendLoading || !canResend) return;

    setResendLoading(true);
    setCanResend(false);

    try {
      await useSendMail({
        to: pendingConfirmation.email,
        subject: "Confirm your DiasporaBase account (Resent)",
        html: welcomeHtml(
          pendingConfirmation.firstName,
          pendingConfirmation.confirmationUrl,
        ),
      });

      // Optional: mark as resent in DB
      const token = pendingConfirmation.confirmationUrl.split("token=")[1];
      await supabase
        .from("confirmation_links")
        .update({ is_resent: true })
        .eq("token_hash", token);

      toast.success("Confirmation email resent successfully!");

      // Start 30-second cooldown
      setResendCountdown(30);
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      toast.error("Failed to resend email. Please try again.");
      setCanResend(true); // Allow retry on failure
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Card className={`w-full max-w-2xl mx-auto shadow-xl border-0 ${modalOpen ? "blur-sm" : ""}`}>
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold text-[#1E293B]">
            Join as a Volunteer
          </CardTitle>
          <CardDescription className="text-base mt-3">
            Make a difference from anywhere in the world
          </CardDescription>
        </CardHeader>
        <div className="flex items-center justify-center mb-2 p-2">
          <GoogleSignUpButton role="volunteer" />
        </div>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  placeholder="Enter First Name"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  disabled={loading}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Enter Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  disabled={loading}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={loading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    disabled={loading}
                    className={
                      errors.password ? "border-red-500 pr-10" : "pr-10"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  disabled={loading}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone Number (Optional)</Label>
              <Input
                type="tel"
                placeholder="+234 801 234 5678"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
              <Checkbox
                id="volunteer-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) =>
                  setAgreedToTerms(checked === true)
                }
                disabled={loading}
                className="mt-0.5"
              />
              <label
                htmlFor="volunteer-terms"
                className="text-sm leading-relaxed text-muted-foreground cursor-pointer select-none"
              >
                I agree to the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setTermsModalOpen(true);
                  }}
                  className="font-medium text-[#0ea5e9] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 rounded"
                >
                  Volunteer Agreement
                </button>
              </label>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={
                  loading ||
                  !agreedToTerms ||
                  Object.keys(errors).length > 0
                }
                className="w-fit h-12 px-10 text-lg font-semibold action-btn shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Register with Email"
                )}
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Already have an account?{" "}
            <Link
              href={routes.login}
              className="font-semibold text-[#0ea5e9] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      <TermsModal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
        title="DiasporaBase Volunteer Terms"
        onAgree={() => setAgreedToTerms(true)}
      >
        <VolunteerTermsContent />
      </TermsModal>

      {/* Success Modal with Resend */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => (open ? setModalOpen(true) : handleCloseModal())}
      >
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden shadow-xl">
          <div
            onMouseEnter={handleModalMouseEnter}
            onMouseLeave={handleModalMouseLeave}
            className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8"
          >
            <DialogHeader className="space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#0ea5e9]/10 ring-4 ring-[#0ea5e9]/20">
                <CheckCircle2 className="h-10 w-10 text-[#0ea5e9]" strokeWidth={2.25} />
              </div>
              <DialogTitle className="text-center text-xl font-semibold tracking-tight">
                Check Your Email
              </DialogTitle>
              <DialogDescription className="mt-1 text-center text-[15px] leading-relaxed">
                We sent a confirmation link to
                <br />
                <strong className="break-all text-foreground font-medium">
                  {pendingConfirmation?.email || "your email"}
                </strong>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex flex-col items-center justify-center space-y-3">
              {/* Resend Confirmation Email — commented out for now
              <Button
                onClick={handleResend}
                disabled={resendLoading || !canResend}
                variant="outline"
                className="w-full max-w-[280px]"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : canResend ? (
                  "Resend Confirmation Email"
                ) : (
                  <>Resend in {resendCountdown}s</>
                )}
              </Button>
              */}

              <Button
                variant="default"
                onClick={handleCloseModal}
                className="w-full max-w-[280px] bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-medium"
              >
                OK, I&apos;ll check my email
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              The confirmation link is valid for 24 hours.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* <DiasporaBaseModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Registration Successful"
        size="sm"
      >
        <div className="p-4">
          <p className="text-center text-sm text-muted-foreground">
            Your registration is complete. Please check your email for confirmation.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center space-y-3">
              <Button
                onClick={handleResend}
                disabled={resendLoading || !canResend}
                variant="outline"
                className="w-full max-w-[280px]"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : canResend ? (
                  "Resend Confirmation Email"
                ) : (
                  <>Resend in {resendCountdown}s</>
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={handleCloseModal}
                className="w-full max-w-[280px]"
              >
                OK, I&apos;ll check my email
              </Button>
            </div>

             <p className="mt-6 text-center text-xs text-muted-foreground">
              The confirmation link is valid for 24 hours.
            </p>
        </div>
      </DiasporaBaseModal> */}
    </>
  );
}
