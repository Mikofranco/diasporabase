"use client";
import { cn } from "@/lib/utils";
import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod"; // Import Zod
import SigninWithGoogleBtn from "./signinwithGoogleBtn";

// Define the Zod schema for form validation
const formSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().min(1, { message: "Last name is required." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." })
      .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter." })
      .regex(/[0-9]/, { message: "Password must contain at least one number." }),
    confirmPassword: z
      .string()
      .min(8, { message: "Confirm password must be at least 8 characters long." })
      .regex(/[a-zA-Z]/, { message: "Confirm password must contain at least one letter." })
      .regex(/[0-9]/, { message: "Confirm password must contain at least one number." }),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof formSchema>;

export default function VolunteerRegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<z.ZodIssue[]>([]); // Store Zod validation errors
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrors([]);

    // Validate form data with Zod
    const result = formSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.issues);
      setLoading(false);
      return;
    }

    // Combine firstName and lastName for full_name
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          full_name: fullName,
          role: "volunteer",
          phone: formData.phone,
          email: formData.email,
        },
      },
    });

    if (signUpError) {
      // setErrors([{ message: signUpError.message, path: ["server"] }]);
      toast.error(signUpError)
      setLoading(false);
      return;
    }

    if (data?.user) {
      localStorage.setItem("diaporabse-email", formData.email);
      toast.success("Registration successful! Please check your email to confirm your account.");
      setTimeout(() => {
        router.push("/volunteer-checkmail");
      }, 2000);
    }

    setLoading(false);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper to get error message for a specific field
  const getErrorMessage = (field: string) => {
    return errors.find((error) => error.path[0] === field)?.message;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Volunteer Registration</CardTitle>
        <CardDescription>Join our community of volunteers and make a difference.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" aria-live="polite">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First Name *</Label>
              <Input
                id="first-name"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
                aria-required="true"
                aria-invalid={!!getErrorMessage("firstName")}
              />
              {getErrorMessage("firstName") && (
                <p className="text-red-500 text-sm" aria-live="assertive">
                  {getErrorMessage("firstName")}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last Name *</Label>
              <Input
                id="last-name"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
                aria-required="true"
                aria-invalid={!!getErrorMessage("lastName")}
              />
              {getErrorMessage("lastName") && (
                <p className="text-red-500 text-sm" aria-live="assertive">
                  {getErrorMessage("lastName")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                aria-required="true"
                aria-invalid={!!getErrorMessage("email")}
              />
              {getErrorMessage("email") && (
                <p className="text-red-500 text-sm" aria-live="assertive">
                  {getErrorMessage("email")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                aria-required="true"
                aria-invalid={!!getErrorMessage("password")}
              />
              {getErrorMessage("password") && (
                <p className="text-red-500 text-sm" aria-live="assertive">
                  {getErrorMessage("password")}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password *</Label>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
                aria-required="true"
                aria-invalid={!!getErrorMessage("confirmPassword")}
              />
              {getErrorMessage("confirmPassword") && (
                <p className="text-red-500 text-sm" aria-live="assertive">
                  {getErrorMessage("confirmPassword")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                aria-invalid={!!getErrorMessage("phone")}
              />
              {getErrorMessage("phone") && (
                <p className="text-red-500 text-sm" aria-live="assertive">
                  {getErrorMessage("phone")}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
            disabled={loading}
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

          {errors.some((error) => error.path[0] === "server") && (
            <p className="text-center text-sm text-red-500" aria-live="assertive">
              {errors.find((error) => error.path[0] === "server")?.message}
            </p>
          )}

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </form>
        <SigninWithGoogleBtn />
      </CardContent>
    </Card>
  );
}