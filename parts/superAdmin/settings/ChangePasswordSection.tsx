"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ChangePasswordSectionProps {
  userEmail: string;
}

export function ChangePasswordSection({ userEmail }: ChangePasswordSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: data.currentPassword,
      });
      if (signInError) throw new Error("Current password is incorrect");

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (updateError) throw updateError;

      toast.success("Password updated successfully.");
      form.reset();
    } catch (err) {
      toast.error("Error updating password: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-none overflow-hidden animate-in fade-in-50 duration-200">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10 text-[#0284C7]">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800">Change Password</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Update your account password securely.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Current Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      {...field}
                      aria-label="Current password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Lock className="h-4 w-4" /> New Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      {...field}
                      aria-label="New password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Confirm New Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      {...field}
                      aria-label="Confirm new password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
