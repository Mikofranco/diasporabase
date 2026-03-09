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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, User, Mail, Lock, Shield } from "lucide-react";
import { toast } from "sonner";

const createAdminSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "super_admin"], {
    required_error: "Please select a role",
  }),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

const ROLE_OPTIONS: { value: CreateAdminFormData["role"]; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

export function CreateAdminSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: undefined,
    },
    mode: "onChange",
  });

  const canSubmit = form.formState.isValid && !form.formState.isSubmitting;

  const onSubmit = async (data: CreateAdminFormData) => {
    setIsSubmitting(true);
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      if (existing) {
        toast.error("An account with this email already exists.");
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: data.role,
            email: data.email,
          },
        },
      });

      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error("User creation failed");

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileError) throw profileError;

      toast.success(`Admin created successfully. Role: ${data.role === "super_admin" ? "Super Admin" : "Admin"}.`);
      form.reset({
        full_name: "",
        email: "",
        password: "",
        role: undefined,
      });
    } catch (err) {
      toast.error("Failed to create admin: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-none overflow-hidden animate-in fade-in-50 duration-200">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0284C7] ring-1 ring-[#0EA5E9]/20">
            <UserPlus className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
              Create Admin
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new user with Admin or Super Admin role.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-w-md"
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" /> Full name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter full name"
                      {...field}
                      aria-label="Full name"
                    />
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      {...field}
                      aria-label="Password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Role
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Select role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 transition-all duration-300"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Admin"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
