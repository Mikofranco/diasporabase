"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail, RefreshCw, AlertCircle, Chrome, Building2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSendMail } from "@/services/mail";
import { welcomeHtml } from "@/lib/email-templates/welcome";
import { encryptUserToJWT } from "@/lib/jwt";

const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").trim(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, "Enter a valid phone number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Must contain at least one letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");

  const supabase = createClient();

  // Real-time validation (only show errors after user types)
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
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setTouched({});
    setErrors({});
    setShowPassword(false);
  };

  // Google Sign-Up
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/confirm`,
          queryParams: { prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Google sign-up failed");
      setGoogleLoading(false);
    }
  };

  // Email/Password Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Mark all fields as touched
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

      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${origin}/confirm`,
          data: {
            full_name: formData.companyName,
            role: "agency",
            phone: formData.phone,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("Registration failed");

      const token = await encryptUserToJWT({
        userId: user.id,
        email: user.email!,
        purpose: "email_confirmation",
      }, "15m");

      const confirmationUrl = `${origin}/confirm?token=${token}`;

      await supabase.from("confirmation_links").insert({
        user_id: user.id,
        email: user.email!,
        confirmation_url: confirmationUrl,
        token_hash: token,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      await useSendMail({
        to: formData.email,
        subject: "Welcome to DiasporaBase – Confirm Your Agency",
        html: welcomeHtml(formData.companyName, confirmationUrl),
        onSuccess: () => {
          toast.success("Agency registered! Check your email to confirm.");
        },
        onError: () => {
          toast.warning("Registered, but email failed. Check spam folder.");
        },
      });

      setEmailForResend(formData.email);
      setModalOpen(true);
      resetForm(); // ← CLEARS FORM AFTER SUCCESS
      localStorage.setItem("diasporabase-email", formData.email);

    } catch (err: any) {
      console.error("Agency registration error:", err);
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailForResend || resendLoading) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailForResend,
        options: { emailRedirectTo: `${window.location.origin}/confirm` },
      });
      if (error) throw error;
      toast.success("Confirmation email resent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 my-20">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold text-[#1E293B]">
            Register Your Agency
          </CardTitle>
          <CardDescription className="text-base mt-3 max-w-md mx-auto">
            Connect with skilled diaspora volunteers to power your development projects
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign-Up */}
          {/* <Button
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            variant="outline"
            className="w-full h-12 text-base font-medium border-2 hover:border-blue-500"
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-5 w-5" />
            )}
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">Or register with email</span>
            </div>
          </div> */}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Organization Name</Label>
              <Input
                id="companyName"
                placeholder="Enter Organization name"
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
              <Label htmlFor="email">Email Address</Label>
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
                placeholder="Enter phone number"
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
              // size="lg"
              disabled={loading || googleLoading || Object.keys(errors).length > 0}
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

          <p className="text-center text-sm text-muted-foreground">
            Already have an agency account?{" "}
            <Link href="/login" className="font-semibold text-[#0ea5e9] hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Check Your Email</DialogTitle>
            <DialogDescription className="text-base mt-3">
              A confirmation link has been sent to<br />
              <strong className="text-foreground">{emailForResend}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-3">
            <Button onClick={handleResend} disabled={resendLoading} variant="outline" className="w-full">
              {resendLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                "Resend Confirmation Email"
              )}
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}