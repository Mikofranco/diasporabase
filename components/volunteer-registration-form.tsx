"use client";
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";

export default function VolunteerRegistrationForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => password.length >= 8;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    // Client-side validation
    if (!formData.firstName) {
      setMessage({ text: "Please enter your first name.", isError: true });
      setLoading(false);
      return;
    }
    if (!formData.lastName) {
      setMessage({ text: "Please enter your last name.", isError: true });
      setLoading(false);
      return;
    }
    if (!isValidEmail(formData.email)) {
      setMessage({ text: "Please enter a valid email address.", isError: true });
      setLoading(false);
      return;
    }
    if (!isValidPassword(formData.password)) {
      setMessage({ text: "Password must be at least 8 characters long.", isError: true });
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match.", isError: true });
      setLoading(false);
      return;
    }

    // Combine firstName and lastName for full_name
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: fullName,
          role: "volunteer",
          phone: formData.phone,
        },
      },
    });

    if (signUpError) {
      setMessage({ text: signUpError.message, isError: true });
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Store email in local storage with key 'diaporabse-email'
      localStorage.setItem("diaporabse-email", formData.email);

      setMessage({
        text: "Registration successful! Please check your email to confirm your account.",
        isError: false,
      });
      toast.success("Registration successful! Please check your email to confirm your account.");
      setTimeout(() => {
        router.push("/volunteer-checkmail");
      }, 2000);
    }

    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
              />
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
              />
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
              />
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
              />
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

          {message && (
            <p
              className={`text-center text-sm ${message.isError ? "text-red-500" : "text-green-500"}`}
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