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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSendMail } from "@/services/mail";
import { welcomeHtml } from "@/lib/email-templates/welcome";
import { encryptUserToJWT } from "@/lib/jwt";

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────
const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: z.string().email("Invalid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[a-zA-Z]/, "Password must contain a letter.")
      .regex(/[0-9]/, "Password must contain a number."),
    confirmPassword: z.string(),
    phone: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

export default function VolunteerRegistrationForm() {
  // ───── form state ─────
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ───── modal state ─────
  const [modalOpen, setModalOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");

  const router = useRouter();
  const supabase = createClient();

  // ───── real-time validation ─────
  useEffect(() => {
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        const p = i.path[0];
        if (p) fieldErrors[p] = i.message;
      });
      setErrors(fieldErrors);
    } else {
      setErrors({});
    }
  }, [formData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ───── clear form ─────
  const clearForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    });
  };

  // ───── resend confirmation ─────
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

  // ───── submit ─────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const result = formSchema.parse(formData);
      const fullName = `${result.firstName} ${result.lastName}`.trim();
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      // 1. Sign-up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: result.email,
        password: result.password,
        options: {
          emailRedirectTo: `${origin}/confirm`,
          data: {
            full_name: fullName,
            role: "volunteer",
            phone: result.phone,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Sign-up failed.");

      // 2. JWT + URL
      const payload = {
        userId: signUpData.user.id,
        email: signUpData.user.email!,
        purpose: "email_confirmation",
      };
      const token = await encryptUserToJWT(payload, "15m");
      const confirmationUrl = `${origin}/confirm?token=${token}`;

      // 3. DB insert
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
        html: welcomeHtml(fullName, confirmationUrl),
        text: `Hi ${fullName},\n\nClick to confirm: ${confirmationUrl}\n\nThanks!`,
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

      // (optional) store email for later login attempts
      localStorage.setItem("diasporabase-email", result.email);
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ───── FORM ───── */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Join as a Volunteer
          </CardTitle>
          <CardDescription className="text-center">
            Create your account and start making an impact.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="first-name">First Name *</Label>
                <Input
                  id="first-name"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  disabled={loading}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="last-name">Last Name *</Label>
                <Input
                  id="last-name"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  disabled={loading}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={loading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
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
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
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

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={loading}
              />
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
                "Register as Volunteer"
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
            <DialogTitle>Check your inbox</DialogTitle>
            <DialogDescription className="mt-2">
              We sent a confirmation link to <strong>{emailForResend}</strong>. Click the link to verify your email.
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