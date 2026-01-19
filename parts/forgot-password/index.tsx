"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSendMail } from "@/services/mail";
import { resetPasswordMail } from "@/lib/email-templates/reset";
import { sendCustomPasswordResetEmail } from "@/services/auth/forgot-password";

const supabase = createClient();

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // const onSubmit = async (data: EmailFormData) => {

  //   setLoading(true);
  //   setSuccess(false);

  //   try {
  //     // Step 1: Let Supabase generate the secure recovery token and redirect URL
  //     const {data:returnedData, error } = await supabase.auth.resetPasswordForEmail(data.email, {
  //       // redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  //     });

  //     if (error) throw error;
  //     console.log("returnedData", returnedData)

  //     // Step 2: Send your beautiful custom email with the correct link
  //     // Note: Supabase doesn't return the token, but the redirectTo URL is where the user should go
  //     const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`;

  //     await useSendMail({
  //       to: data.email,
  //       subject: "Reset Your DiasporaBase Password",
  //       html: resetPasswordMail(resetLink),
  //       onSuccess: () => {
  //         setSuccess(true);
  //         toast.success("Custom reset email sent!");
  //       },
  //       onError: (err) => {
  //         console.error("Custom email failed:", err);
  //         // Still show success because Supabase already sent the official link
  //         setSuccess(true);
  //         toast.warning("Official reset link sent by Supabase. Custom email failed.");
  //       },
  //     });

  //     // Final success state
  //     setSuccess(true);
  //     toast.success("Password reset link sent! Check your email.");
  //   } catch (err: any) {
  //     console.error("Reset password failed:", err);
  //     toast.error(err.message || "Failed to send reset link. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onSubmit = async (data: EmailFormData) => {
  setLoading(true);
  setSuccess(false);

  try {
    const formData = new FormData();
    formData.append("email", data.email);

    const result = await sendCustomPasswordResetEmail(formData);

    if (!result.success) {
      throw new Error(result.error);
    }

    setSuccess(true);
    toast.success("Password reset link sent! Check your email.");
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to send reset link. Try again.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 text-center">
                <strong>Check your email!</strong><br />
                We've sent a password reset link to your inbox.<br />
                <span className="text-sm">It may take a few minutes to arrive.</span>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0c94d1] hover:to-[#0369a1]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-1 mx-auto text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}