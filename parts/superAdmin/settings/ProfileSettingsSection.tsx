"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, User, Mail } from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  email_notifications: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  notification_preferences: { email_notifications: boolean };
}

interface ProfileSettingsSectionProps {
  profile: Profile;
  onProfileUpdated: (updates: Partial<Profile>) => void;
}

export function ProfileSettingsSection({ profile, onProfileUpdated }: ProfileSettingsSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      email: profile.email || "",
      email_notifications: profile.notification_preferences?.email_notifications ?? true,
    },
  });

  useEffect(() => {
    form.setValue("full_name", profile.full_name || "");
    form.setValue("email", profile.email || "");
    form.setValue("email_notifications", profile.notification_preferences?.email_notifications ?? true);
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          email: data.email,
          notification_preferences: { email_notifications: data.email_notifications },
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      if (data.email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: data.email });
        if (authError) throw authError;
      }

      onProfileUpdated({
        full_name: data.full_name,
        email: data.email,
        notification_preferences: { email_notifications: data.email_notifications },
      });
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error("Error updating profile: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-none overflow-hidden animate-in fade-in-50 duration-200">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10 text-[#0284C7]">
            <User className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800">Profile Settings</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your name, email and notification preferences.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" /> Full Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} aria-label="Full name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email"
                      {...field}
                      aria-label="Email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email_notifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium text-gray-600">
                      Email Notifications
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates and notifications
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Toggle email notifications"
                      className="data-[state=checked]:bg-[#0EA5E9] data-[state=unchecked]:bg-gray-300 border-none focus:ring-2 focus:ring-[#0EA5E9] transition-colors"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Profile Changes"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
