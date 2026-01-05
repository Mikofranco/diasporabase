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
  Chrome,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSendMail } from "@/services/mail";
import { welcomeHtml } from "@/lib/email-templates/welcome";
import { encryptUserToJWT } from "@/lib/jwt";

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");

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

  // Reset form completely
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
          redirectTo: `${window.location.origin}/confirm`, // or /dashboard/volunteer
          queryParams: {
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      // Redirect happens automatically
    } catch (err: any) {
      toast.error(err.message || "Google sign-up failed");
      setGoogleLoading(false);
    }
  };

  // Email/Password Sign-Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

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
      const enteredFirstName = formData.firstName.trim();

      const {
        data: { user },
        error: signUpError,
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${origin}/confirm`,
          data: {
            full_name: fullName,
            role: "volunteer",
            phone: formData.phone || null,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("Account creation failed");

      const token = await encryptUserToJWT(
        {
          userId: user.id,
          email: user.email!,
          purpose: "email_confirmation",
        },
        "15m"
      );

       const confirmationUrl = `${origin}/api/confirm-email?token=${token}`;

      await supabase.from("confirmation_links").insert({
        user_id: user.id,
        email: user.email!,
        confirmation_url: confirmationUrl,
        token_hash: token,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      await useSendMail({
        to: formData.email,
        subject: "Welcome to DiasporaBase – Confirm Your Email",
        html: welcomeHtml(enteredFirstName as string, confirmationUrl),
        onSuccess: () => {
          toast.success("Account created! Check your email to confirm.");
        },
        onError: () => {
          toast.warning("Account created, but email failed. Check spam.");
        },
      });

      setEmailForResend(formData.email);
      setModalOpen(true);
      resetForm(); // ← CLEARS FORM AFTER SUCCESS
      localStorage.setItem("diasporabase-email", formData.email);
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Try again.");
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
            Join as a Volunteer
          </CardTitle>
          <CardDescription className="text-base mt-3">
            Make a difference from anywhere in the world
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2 sm:space-y-6">
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
              <span className="bg-background px-2 text-muted-foreground">Or register with email</span>
            </div>
          </div> */}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Fields */}
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

            {/* Email, Password, etc. (same as before) */}
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
                    className="absolute right-3 top-3 text-gray-500"
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

            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                disabled={
                  loading || googleLoading || Object.keys(errors).length > 0
                }
                className="w-fit h-12 text-lg font-semibold action-btn shadow-lg "
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

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#0ea5e9] hover:underline"
            >
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
              Confirmation link sent to
              <br />
              <strong className="text-foreground">{emailForResend}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleResend}
              disabled={resendLoading}
              variant="outline"
              className="w-full"
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                "Resend Email"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
