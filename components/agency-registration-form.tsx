"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { MultiSelectSkills } from "./multi-select-skills"; // Reusing for focus areas and environment
import { expertiseData } from "@/data/expertise"; // For focus areas
import {
  ALL_AFRICAN_STATES_FLATTENED,
  ALL_AFRICAN_LGAS_FLATTENED,
} from "@/data/african-locations"; // For environment
import { Checkbox } from "@/components/ui/checkbox"; // New import
import { CheckboxReactHookFormMultiple } from "./renderedItems";

export default function AgencyRegistrationForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    contactPersonFirstName: "",
    contactPersonLastName: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    website: "",
    address: "",
    organizationType: "",
    description: "",
    taxId: "",
    focusAreas: [] as string[],
    environmentCities: [] as string[],
    environmentStates: [] as string[],
  });
  const [certifyAccurate, setCertifyAccurate] = useState(false); // New state
  const [agreeToTerms, setAgreeToTerms] = useState(false); // New state
  const [receiveUpdates, setReceiveUpdates] = useState(false); // New state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => password.length >= 8;

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
    if (!formData.organizationName.trim()) {
      setMessage({ text: "Organization Name is required.", isError: true });
      setLoading(false);
      return;
    }
    if (
      !formData.contactPersonFirstName.trim() ||
      !formData.contactPersonLastName.trim()
    ) {
      setMessage({
        text: "Contact Person's Full Name is required.",
        isError: true,
      });
      setLoading(false);
      return;
    }
    if (!formData.organizationType) {
      setMessage({ text: "Organization Type is required.", isError: true });
      setLoading(false);
      return;
    }
    if (!formData.address.trim()) {
      setMessage({ text: "Address is required.", isError: true });
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setMessage({
        text: "Organization Description is required.",
        isError: true,
      });
      setLoading(false);
      return;
    }
    if (!certifyAccurate) {
      setMessage({
        text: "Please certify that the information provided is accurate.",
        isError: true,
      });
      setLoading(false);
      return;
    }
    if (!agreeToTerms) {
      setMessage({
        text: "You must agree to the Terms of Service and Privacy Policy.",
        isError: true,
      });
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: `${formData.contactPersonFirstName} ${formData.contactPersonLastName}`, // Store combined name for initial user profile
          organization_name: formData.organizationName,
          role: "agency",
        },
      },
    });

    if (signUpError) {
      setMessage({ text: signUpError.message, isError: true });
      setLoading(false);
      return;
    }

    if (data?.user) {
      console.log("User signed up successfully. User ID:", data.user.id);

      const updatePayload = {
        organization_name: formData.organizationName,
        contact_person_first_name: formData.contactPersonFirstName,
        contact_person_last_name: formData.contactPersonLastName,
        contact_person_email: formData.contactPersonEmail || formData.email,
        contact_person_phone: formData.contactPersonPhone,
        website: formData.website,
        address: formData.address,
        organization_type: formData.organizationType,
        description: formData.description,
        tax_id: formData.taxId,
        focus_areas: formData.focusAreas,
        environment_cities: formData.environmentCities,
        environment_states: formData.environmentStates,
        receives_updates: receiveUpdates,
      };

      console.log("Profile update payload:", updatePayload);

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", data.user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        setMessage({
          text: `Failed to save organization details: ${updateError.message}`,
          isError: true,
        });
        setLoading(false);
        return;
      }

      setMessage({
        text: "Registration successful! Please check your email to confirm your account.",
        isError: false,
      });
      setTimeout(() => {
        router.push("/auth/callback");
      }, 2000);
    }

    setLoading(false);
  };

  const handleInputChange = (
    field: string,
    value: string | string[] | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Agency Registration</CardTitle>
        <CardDescription>
          Register your organization to connect with volunteers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" aria-live="polite">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="organization-name">Organization Name *</Label>
              <Input
                id="organization-name"
                type="text"
                placeholder="Helping Hands Foundation"
                value={formData.organizationName}
                onChange={(e) =>
                  handleInputChange("organizationName", e.target.value)
                }
                required
                aria-required="true"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization-type">Organization Type *</Label>
              <Select
                value={formData.organizationType}
                onValueChange={(value) =>
                  handleInputChange("organizationType", value)
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nonprofit">Non-profit</SelectItem>
                  <SelectItem value="charity">Charity</SelectItem>
                  <SelectItem value="government">Government Agency</SelectItem>
                  <SelectItem value="educational">
                    Educational Institution
                  </SelectItem>
                  <SelectItem value="religious">
                    Religious Organization
                  </SelectItem>
                  <SelectItem value="community">Community Group</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contact-first-name">
                Contact Person First Name *
              </Label>
              <Input
                id="contact-first-name"
                type="text"
                placeholder="Jane"
                value={formData.contactPersonFirstName}
                onChange={(e) =>
                  handleInputChange("contactPersonFirstName", e.target.value)
                }
                required
                aria-required="true"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-last-name">
                Contact Person Last Name *
              </Label>
              <Input
                id="contact-last-name"
                type="text"
                placeholder="Smith"
                value={formData.contactPersonLastName}
                onChange={(e) =>
                  handleInputChange("contactPersonLastName", e.target.value)
                }
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Login Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@helpinghands.org"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-email">Contact Email (Optional)</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="info@helpinghands.org"
                value={formData.contactPersonEmail}
                onChange={(e) =>
                  handleInputChange("contactPersonEmail", e.target.value)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Login Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567" //@ts-ignore
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-phone">
                Contact Phone Number (Optional)
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="+1 (555) 987-6543"
                value={formData.contactPersonPhone}
                onChange={(e) =>
                  handleInputChange("contactPersonPhone", e.target.value)
                }
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
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.helpinghands.org"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main St, City, State, ZIP"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              required
              aria-required="true"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Organization Description *</Label>
            <Textarea
              id="description"
              placeholder="Tell us about your organization's mission and activities..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              required
              aria-required="true"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tax-id">Tax ID / EIN (Optional)</Label>
            <Input
              id="tax-id"
              type="text"
              placeholder="12-3456789"
              value={formData.taxId}
              onChange={(e) => handleInputChange("taxId", e.target.value)}
            />
          </div>

          {/* <div className="grid gap-2">
            <Label htmlFor="focus-areas">Focus Areas (Where you create projects)</Label>
            <MultiSelectSkills
              options={ALL_EXPERTISE_OPTIONS} // Reusing expertise options for focus areas
              selected={formData.focusAreas}
              onChange={(selectedAreas) => handleInputChange("focusAreas", selectedAreas)}
              placeholder="Select your organization's focus areas..."
            />
          </div> */}
          <CheckboxReactHookFormMultiple items={expertiseData} />

          <div className="grid gap-2">
            <Label htmlFor="environment-states">
              Operating States (Where you operate/create projects)
            </Label>
            <MultiSelectSkills
              options={ALL_AFRICAN_STATES_FLATTENED}
              selected={formData.environmentStates}
              onChange={(selectedStates) =>
                handleInputChange("environmentStates", selectedStates)
              }
              placeholder="Select states where you operate..."
            />
          </div>

          {/* <div className="grid gap-2">
            <Label htmlFor="environment-cities">Operating Cities/LGAs (Optional)</Label>
            <MultiSelectSkills
              options={ALL_AFRICAN_LGAS_FLATTENED}
              selected={formData.environmentCities}
              onChange={(selectedCities) => handleInputChange("environmentCities", selectedCities)}
              placeholder="Select specific cities/LGAs (optional)..."
            />
          </div> */}

          {/* Verification Checkboxes */}
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="certify-accurate"
                checked={certifyAccurate}
                onCheckedChange={(checked) => setCertifyAccurate(!!checked)}
                required
              />
              <Label
                htmlFor="certify-accurate"
                className="text-sm text-gray-400 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I certify that the information provided is accurate and
                complete. I understand that false information may result in
                rejection of this application. *
              </Label>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agree-terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(!!checked)}
                required
              />
              <Label
                htmlFor="agree-terms"
                className="text-sm  text-gray-400 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <Link href="#" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="underline">
                  Privacy Policy
                </Link>{" "}
                of DiapoaraBase platform. *
              </Label>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="receive-updates"
                checked={receiveUpdates}
                onCheckedChange={(checked) => setReceiveUpdates(!!checked)}
              />
              <Label
                htmlFor="receive-updates"
                className="text-sm text-gray-400 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I would like to receive updates and notifications about
                volunteer opportunities and platform features.
              </Label>
            </div>
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
              "Register Organization"
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
