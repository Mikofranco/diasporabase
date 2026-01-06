"use client";

import { useState, useEffect } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  RefreshCw,
  AlertCircle,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSendMail } from "@/services/mail";
import { welcomeHtmlAgency } from "@/lib/email-templates/welcome";
import { encryptUserToJWT } from "@/lib/jwt";

const formSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .trim(),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-\(\)]{10,}$/, "Enter a valid phone number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Must contain at least one letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

const DEFAULT_FORM = {
  companyName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function AgencyRegistrationForm() {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  // Modal & Resend
  const [modalOpen, setModalOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Store these for reliable resend
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    email: string;
    companyName: string;
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

    setTouched({
      companyName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    const result = formSchema.safeParse(formData);
    if (!result.success) {
      toast.error("Please fix the errors below");
      return;
    }

    setLoading(true);

    try {
      const origin = window.location.origin;

      const {
        data: { user },
        error: signUpError,
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.companyName.trim(),
            role: "agency",
            phone: formData.phone,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("Registration failed");

      // Generate 24-hour token
      const token = await encryptUserToJWT(
        {
          userId: user.id,
          email: user.email!,
          purpose: "email_confirmation",
        },
        "24h" // ← Now 24 hours
      );

      const confirmationUrl = `${origin}/confirm?token=${token}`;

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save confirmation link
      await supabase.from("confirmation_links").insert({
        user_id: user.id,
        email: user.email!,
        confirmation_url: confirmationUrl,
        token_hash: token,
        expires_at: expiresAt.toISOString(),
        is_resent: false,
      });

      // Send welcome email
      await useSendMail({
        to: formData.email,
        subject: "Welcome to DiasporaBase – Confirm Your Agency Account",
        html: welcomeHtmlAgency(formData.companyName.trim(), confirmationUrl),
      });

      // Store for resend
      setPendingConfirmation({
        email: formData.email,
        companyName: formData.companyName.trim(),
        confirmationUrl,
      });

      toast.success("Agency registered! Please check your email to confirm.");
      setModalOpen(true);
      resetForm();
      localStorage.setItem("diasporabase-email", formData.email);
    } catch (err: any) {
      console.error("Agency registration error:", err);
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Improved resend with cooldown
  const handleResend = async () => {
    if (!pendingConfirmation || resendLoading || !canResend) return;

    setResendLoading(true);
    setCanResend(false);

    try {
      await useSendMail({
        to: pendingConfirmation.email,
        subject: "Confirm Your DiasporaBase Agency Account (Resent)",
        html: welcomeHtmlAgency(pendingConfirmation.companyName, pendingConfirmation.confirmationUrl),
      });

      // Optional: mark as resent
      const token = pendingConfirmation.confirmationUrl.split("token=")[1];
      await supabase
        .from("confirmation_links")
        .update({ is_resent: true })
        .eq("token_hash", token);

      toast.success("Confirmation email resent successfully!");

      // 30-second cooldown
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
      setCanResend(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 my-20">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold text-[#1E293B] flex items-center justify-center gap-3">
            <Building2 className="h-10 w-10 text-primary" />
            Register Your Agency
          </CardTitle>
          <CardDescription className="text-base mt-3 max-w-md mx-auto">
            Connect with skilled diaspora volunteers to power your development projects
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Organization Name</Label>
              <Input
                id="companyName"
                placeholder="e.g. Hope Foundation Nigeria"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                disabled={loading}
                className={errors.companyName ? "border-red-500" : ""}
              />
              {errors.companyName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@youragency.org"
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

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={loading}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Passwords */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    disabled={loading}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
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

            <Button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full h-12 text-lg font-semibold action-btn shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Agency Account...
                </>
              ) : (
                "Register Agency"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Already have an agency account?{" "}
            <Link href="/login" className="font-semibold text-[#0ea5e9] hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Success Modal with Resend */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Check Your Email</DialogTitle>
            <DialogDescription className="text-base mt-3">
              A confirmation link has been sent to
              <br />
              <strong className="text-foreground break-all">
                {pendingConfirmation?.email || "your email"}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleResend}
              disabled={resendLoading || !canResend}
              variant="outline"
              className="w-full"
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

            {/* <Button
              onClick={() => setModalOpen(false)}
              className="w-full"
            >
              OK, I'll check my email
            </Button> */}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            The confirmation link is valid for 24 hours.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
