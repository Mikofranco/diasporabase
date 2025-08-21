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

export default function AgencyRegistrationForm() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) =>
    /^\+?[\d\s-]{10,}$/.test(phone); // Basic phone validation (adjust as needed)
  const isValidPassword = (password: string) => password.length >= 8;
  const isValidCompanyName = (companyName: string) => companyName.trim().length >= 2;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    // Client-side validation
    if (!isValidEmail(formData.email)) {
      setMessage({
        text: "Please enter a valid email address.",
        isError: true,
      });
      setLoading(false);
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setMessage({
        text: "Please enter a valid phone number (at least 10 digits).",
        isError: true,
      });
      setLoading(false);
      return;
    }
    if (!isValidCompanyName(formData.companyName)) {
      setMessage({
        text: "Company name must be at least 2 characters long.",
        isError: true,
      });
      setLoading(false);
      return;
    }
    if (!isValidPassword(formData.password)) {
      setMessage({
        text: "Password must be at least 8 characters long.",
        isError: true,
      });
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match.", isError: true });
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
          role: "agency"
        },
      },
    });

    if (signUpError) {
      setMessage({ text: signUpError.message, isError: true });
      setLoading(false);
      return;
    }

    if (data?.user) {
      setMessage({
        text: "Registration successful! Please check your email to confirm your account.",
        isError: false,
      });
      // No immediate redirect; user must confirm email first
    }

    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            />
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
            />
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
            />
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
            />
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
            />
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

          {message && (
            <p
              className={`text-center text-sm ${
                message.isError ? "text-red-500" : "text-green-500"
              }`}
              aria-live="assertive"
            >
              {message.text}
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