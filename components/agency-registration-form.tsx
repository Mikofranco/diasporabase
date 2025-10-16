"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { z } from "zod"; // Import Zod
import { toast } from "sonner";

// Define the Zod schema for form validation
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
    confirmPassword: z
      .string()
      .min(8, { message: "Confirm password must be at least 8 characters long." })
      .regex(/[a-zA-Z]/, { message: "Confirm password must contain at least one letter." })
      .regex(/[0-9]/, { message: "Confirm password must contain at least one number." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // Error associated with confirmPassword field
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          phone: formData.phone,
          full_name: formData.companyName, // Stored as metadata
          role: "agency",
          email: formData.email,
        },
      },
    });

    if (signUpError) {
      // setErrors([{ message: signUpError, path: ["server"] }]);
      toast.error(signUpError)
      setLoading(false);
      return;
    }

    if (data?.user) {
      setFormData({
        email: "",
        phone: "",
        companyName: "",
        password: "",
        confirmPassword: "",
      });
      setErrors([]);
      setTimeout(() => {
        router.push("/agency-checkmail");
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Agency Registration</CardTitle>
        <CardDescription>
          Register your account to connect with volunteers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" aria-live="polite">
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Enter name of Organisation"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!getErrorMessage("companyName")}
              className={getErrorMessage("companyName") ? "border-red-500" : ""}
            />
            {getErrorMessage("companyName") && (
              <p className="text-red-500 text-sm" aria-live="assertive">
                {getErrorMessage("companyName")}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!getErrorMessage("email")}
              className={getErrorMessage("email") ? "border-red-500" : ""}
            />
            {getErrorMessage("email") && (
              <p className="text-red-500 text-sm" aria-live="assertive">
                {getErrorMessage("email")}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!getErrorMessage("phone")}
              className={getErrorMessage("phone") ? "border-red-500" : ""}
            />
            {getErrorMessage("phone") && (
              <p className="text-red-500 text-sm" aria-live="assertive">
                {getErrorMessage("phone")}
              </p>
            )}
          </div>
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
              className={getErrorMessage("password") ? "border-red-500" : ""}
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
              className={getErrorMessage("confirmPassword") ? "border-red-500" : ""}
            />
            {getErrorMessage("confirmPassword") && (
              <p className="text-red-500 text-sm" aria-live="assertive">
                {getErrorMessage("confirmPassword")}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-primary text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Register"
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
      </CardContent>
    </Card>
  );
}