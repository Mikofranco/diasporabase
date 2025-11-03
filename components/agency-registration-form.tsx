"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSendMail } from "@/services/mail";
import { welcomeHtml } from "@/lib/email-templates/welcome";
import { encryptUserToJWT } from "@/lib/jwt";

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schema
// ─────────────────────────────────────────────────────────────────────────────
const formSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z
      .string()
      .regex(/^\+?[\d\s-]{10,}$/, { message: "Please enter a valid phone number (at least 10 digits)." }),
    companyName: z
      .string()
      .min(2, { message: "Company name must be at least 2 characters long." })
      .trim(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." })
      .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter." })
      .regex(/[0-9]/, { message: "Password must contain at least one number." }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

export default function AgencyRegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    phone: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");

  const router = useRouter();
  const supabase = createClient();

  // ───── Real-time validation ─────
  useEffect(() => {
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
    } else {
      setErrors({});
    }
  }, [formData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const clearForm = () => {
    setFormData({
      email: "",
      phone: "",
      companyName: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleResend = async () => {
    if (!emailForResend) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailForResend,
        options: { emailRedirectTo: `${window.location.origin}/confirm` },
      });
      if (error) throw error;
      toast.success("Confirmation email resent!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to resend email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const result = formSchema.parse(formData);
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      // 1. Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: result.email,
        password: result.password,
        options: {
          emailRedirectTo: `${origin}/confirm`,
          data: {
            full_name: result.companyName,
            role: "agency",
            phone: result.phone,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Sign-up failed.");

      // 2. JWT + Confirmation URL
      const payload = {
        userId: signUpData.user.id,
        email: signUpData.user.email!,
        purpose: "email_confirmation",
      };
      const token = await encryptUserToJWT(payload, "15m");
      const confirmationUrl = `${origin}/confirm?token=${token}`;

      // 3. Save to DB
      const { error: dbError } = await supabase
        .from("confirmation_links")
        .insert({
          user_id: signUpData.user.id,
          email: signUpData.user.email!,
          confirmation_url: confirmationUrl,
          token_hash: token,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          used: false,
        });

      if (dbError) throw dbError;

      // 4. Send welcome email
      await useSendMail({
        to: result.email,
        subject: "Welcome to DiasporaBase – Confirm Your Email",
        html: welcomeHtml(result.companyName, confirmationUrl),
        text: `Hi ${result.companyName},\n\nClick to confirm: ${confirmationUrl}\n\nThanks!`,
        onSuccess: () => {
          toast.success("Check your email to confirm your account!");
        },
        onError: (msg) => {
          console.error("Email failed:", msg);
          toast.error("Account created, but email failed. Contact support.");
        },
      });

      // 5. Show modal + clear form
      setEmailForResend(result.email);
      setModalOpen(true);
      clearForm();

      localStorage.setItem("diasporabase-email", result.email);
    } catch (err: any) {
      console.error("Agency registration error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ───── FORM ───── */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Agency Registration
          </CardTitle>
          <CardDescription className="text-center">
            Register your organization to connect with volunteers.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div className="space-y-1">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="DiasporaBase Inc."
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                disabled={loading}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={loading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={loading}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            {/* Passwords */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm Password *</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full h-11 text-base font-medium bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0c94d1] hover:to-[#0369a1]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Register Agency"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* ───── SUCCESS MODAL ───── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <Mail className="mx-auto h-12 w-12 text-primary mb-3" />
            <DialogTitle>Check Your Inbox</DialogTitle>
            <DialogDescription className="mt-2">
              We sent a confirmation link to <strong>{emailForResend}</strong>. Click it to verify your agency.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full"
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                "Resend Confirmation Email"
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