"use client"

import { cn } from "@/lib/utils"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { MultiSelectSkills } from "./multi-select-skills"
import { expertiseData } from "@/data/expertise"
import { LocationSelects } from "./location-selects"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckboxReactHookFormMultiple } from "./renderedItems"

export default function VolunteerRegistrationForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    skills: [] as string[],
    availabilityType: "full-time" as "full-time" | "specific-period",
    availabilityStartDate: undefined as Date | undefined,
    availabilityEndDate: undefined as Date | undefined,
    experience: "",
    residenceCountry: "", // Will be auto-filled
    residenceState: "", // Will be auto-filled
    originCountry: "",
    originState: "",
    originLga: "",
    volunteerCountry: "",
    volunteerState: "",
    volunteerLga: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Simulate automatic location detection on component mount
  useEffect(() => {
    // In a real application, you would use a geolocation API here.
    // For example, fetching from a serverless function that uses IP lookup:
    // fetch('/api/get-location').then(res => res.json()).then(data => {
    //   setFormData(prev => ({
    //     ...prev,
    //     residenceCountry: data.country,
    //     residenceState: data.state,
    //   }));
    // }).catch(console.error);

    // For demonstration, hardcoding a value:
    setFormData((prev) => ({
      ...prev,
      residenceCountry: "Nigeria", // Example: auto-detected country
      residenceState: "Lagos", // Example: auto-detected state
    }))
  }, [])

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidPassword = (password: string) => password.length >= 8

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    // Client-side validation
    if (!isValidEmail(formData.email)) {
      setMessage({ text: "Please enter a valid email address.", isError: true })
      setLoading(false)
      return
    }
    if (!isValidPassword(formData.password)) {
      setMessage({ text: "Password must be at least 8 characters long.", isError: true })
      setLoading(false)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match.", isError: true })
      setLoading(false)
      return
    }
    if (!formData.originCountry) {
      setMessage({ text: "Please select your country of origin.", isError: true })
      setLoading(false)
      return
    }
    if (!formData.volunteerCountry) {
      setMessage({ text: "Please select a country where you would like to volunteer.", isError: true })
      setLoading(false)
      return
    }
    if (
      formData.availabilityType === "specific-period" &&
      (!formData.availabilityStartDate || !formData.availabilityEndDate)
    ) {
      setMessage({ text: "Please select both a start and end date for your availability period.", isError: true })
      setLoading(false)
      return
    }
    if (
      formData.availabilityType === "specific-period" &&
      formData.availabilityStartDate &&
      formData.availabilityEndDate &&
      formData.availabilityStartDate > formData.availabilityEndDate
    ) {
      setMessage({ text: "Start date cannot be after end date.", isError: true })
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: "volunteer",
        },
      },
    })

    if (signUpError) {
      setMessage({ text: signUpError.message, isError: true })
      setLoading(false)
      return
    }

    if (data?.user) {
      console.log("User signed up successfully. User ID:", data.user.id)

      // Prepare availability data for storage
      const availabilityToStore =
        formData.availabilityType === "full-time"
          ? "full-time"
          : JSON.stringify({
              startDate: formData.availabilityStartDate ? format(formData.availabilityStartDate, "yyyy-MM-dd") : null,
              endDate: formData.availabilityEndDate ? format(formData.availabilityEndDate, "yyyy-MM-dd") : null,
            })

      const updatePayload = {
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        skills: formData.skills,
        availability: availabilityToStore,
        experience: formData.experience,
        residence_country: formData.residenceCountry,
        residence_state: formData.residenceState,
        origin_country: formData.originCountry,
        origin_state: formData.originState,
        origin_lga: formData.originLga,
        volunteer_country: formData.volunteerCountry,
        volunteer_state: formData.volunteerState,
        volunteer_lga: formData.volunteerLga,
      }

      console.log("Profile update payload:", updatePayload)

      // Update the profile with additional volunteer-specific data
      const { error: updateError } = await supabase.from("profiles").update(updatePayload).eq("id", data.user.id)

      if (updateError) {
        console.error("Profile update error:", updateError)
        setMessage({ text: `Failed to save volunteer details: ${updateError.message}`, isError: true })
        setLoading(false)
        return
      }

      setMessage({ text: "Registration successful! Please check your email to confirm your account.", isError: false })
      setTimeout(() => {
        router.push("/auth/callback")
      }, 2000)
    }

    setLoading(false)
  }

  const handleInputChange = (field: string, value: string | string[] | Date | "full-time" | "specific-period") => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
              <Label htmlFor="full-name">Full Name *</Label>
              <Input
                id="full-name"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                required
                aria-required="true"
              />
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="grid gap-2">
              <Label htmlFor="date-of-birth">Date of Birth</Label>
              <Input
                id="date-of-birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              />
            </div>
          </div>

          {/* <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main St, City, State, ZIP"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div> */}

          <CheckboxReactHookFormMultiple items={expertiseData}/>

          {/* <div className="grid gap-2">
            <Label htmlFor="skills">Skills & Interests</Label>
            <MultiSelectSkills
              options={expertiseData}

              selected={formData.skills}
              onChange={(selectedSkills) => handleInputChange("skills", selectedSkills)}
              placeholder="Select your fields of expertise..."
            />
          </div> */}

          <div className="grid gap-2">
            <Label>Availability</Label>
            <RadioGroup
              value={formData.availabilityType}
              onValueChange={(value: "full-time" | "specific-period") => {
                handleInputChange("availabilityType", value)
                if (value === "full-time") {//@ts-ignore
                  handleInputChange("availabilityStartDate", undefined)//@ts-ignore
                  handleInputChange("availabilityEndDate", undefined)
                }
              }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full-time" id="availability-full-time" />
                <Label htmlFor="availability-full-time">Full-time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific-period" id="availability-specific-period" />
                <Label htmlFor="availability-specific-period">Specific Period</Label>
              </div>
            </RadioGroup>
            {formData.availabilityType === "specific-period" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.availabilityStartDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.availabilityStartDate ? (
                          format(formData.availabilityStartDate, "PPP")
                        ) : (
                          <span>Pick a start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.availabilityStartDate}//@ts-ignore
                        onSelect={(date) => handleInputChange("availabilityStartDate", date || undefined)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.availabilityEndDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.availabilityEndDate ? (
                          format(formData.availabilityEndDate, "PPP")
                        ) : (
                          <span>Pick an end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.availabilityEndDate}//@ts-ignore
                        onSelect={(date) => handleInputChange("availabilityEndDate", date || undefined)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="experience">Previous Volunteer Experience</Label>
            <Textarea
              id="experience"
              placeholder="Tell us about your previous volunteer experience..."
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
              rows={3}
            />
          </div>

          {/* Residence Information (Auto-tracked, not editable by user) */}
          <div className="grid gap-2">
            <Label>Country of Residence</Label>
            <Input
              id="residence-country"
              type="text"
              value={formData.residenceCountry || "Detecting..."}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="grid gap-2">
            <Label>State of Residence</Label>
            <Input
              id="residence-state"
              type="text"
              value={formData.residenceState || "Detecting..."}
              disabled
              className="bg-muted"
            />
          </div>

          <LocationSelects
            label="Country of Origin"
            country={formData.originCountry}
            state={formData.originState}
            lga={formData.originLga}
            onChangeCountry={(value) => {
              handleInputChange("originCountry", value)
              handleInputChange("originState", "")
              handleInputChange("originLga", "")
            }}
            onChangeState={(value) => {
              handleInputChange("originState", value)
              handleInputChange("originLga", "")
            }}
            onChangeLga={(value) => handleInputChange("originLga", value)}
            required
          />

          <LocationSelects
            label="Volunteer Location Preference"
            country={formData.volunteerCountry}
            state={formData.volunteerState}
            lga={formData.volunteerLga}
            onChangeCountry={(value) => {
              handleInputChange("volunteerCountry", value)
              handleInputChange("volunteerState", "")
              handleInputChange("volunteerLga", "")
            }}
            onChangeState={(value) => {
              handleInputChange("volunteerState", value)
              handleInputChange("volunteerLga", "")
            }}
            onChangeLga={(value) => handleInputChange("volunteerLga", value)}
            required
            stateOptional
            lgaOptional
          />

          <Button type="submit" className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90" disabled={loading}>
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
  )
}
