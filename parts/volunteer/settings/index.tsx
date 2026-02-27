// app/dashboard/volunteer/settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserId, signOutUser } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Lock, Bell, LogOut, ArrowLeft, Trash2 } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { routes } from "@/lib/routes";

const supabase = createClient();

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  notification_preferences: { email_notifications: boolean };
}

const passwordSchema = z
  .object({
    current_password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    new_password: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirm_password: z.string().min(6, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const VolunteerSettings: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to access settings.");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, notification_preferences")
          .eq("id", userId)
          .single();

        if (profileError)
          throw new Error("Error fetching profile: " + profileError.message);
        if (!profileData || profileData.role !== "volunteer") {
          throw new Error("Only volunteers can access this page.");
        }

        setProfile(profileData);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordChange = async (data: z.infer<typeof passwordSchema>) => {
    try {
      // Note: Supabase does not provide a direct way to verify current_password client-side.
      // For production, implement server-side verification via a Supabase function or edge function.
      const { error } = await supabase.auth.updateUser({
        password: data.new_password,
      });

      if (error) throw new Error("Error updating password: " + error.message);

      toast.success("Password updated successfully!");
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleNotificationToggle = async (checked: boolean) => {
    if (!profile) {
      toast.error("Please log in to update notification settings.");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: { email_notifications: checked } })
        .eq("id", profile.id);

      if (error)
        throw new Error(
          "Error updating notification preferences: " + error.message,
        );

      setProfile({
        ...profile,
        notification_preferences: { email_notifications: checked },
      });
      toast.success("Notification preferences updated!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) {
      toast.error("Please log in to delete account.");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (error) throw new Error("Error deleting account: " + error.message);

      const result = await signOutUser();
      toast.success("Account deleted successfully.");
      if (!result.success) {
        console.error("Error during post-delete sign out:", result.error);
      }
      router.push(routes.login);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(3)].map((_, idx) => (
            <Card key={idx} className="shadow-sm border rounded-xl">
              <CardHeader className="space-y-2 border-b border-gray-100">
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-4 w-40 rounded-lg" />
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg border-red-200 bg-red-50 rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-red-600">{error}</CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => router.push(routes.volunteerDashboard)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your password, notifications, and account access.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
          onClick={() => router.push(routes.volunteerDashboard)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border bg-white rounded-xl">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-gray-500" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                className="space-y-6"
              >
                <FormField
                  control={passwordForm.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600">
                        Current Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter current password"
                          className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter new password"
                          className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600">
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm new password"
                          className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg h-12"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="action-btn text-lg py-6 rounded-lg transition-colors duration-200"
                >
                  Change Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-gray-500" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-600">
                Receive Email Notifications
              </Label>
              <Switch
                checked={profile?.notification_preferences.email_notifications}
                onCheckedChange={handleNotificationToggle}
                className="data-[state=checked]:bg-[#0EA5E9]"
                aria-label="Toggle email notifications"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Enable to receive email updates about volunteer requests and
              project updates.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardHeader className="border-b border-gray-200 space-y-1">
            <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-gray-500" />
              Account Management
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Permanently delete your volunteer account and all associated data.
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              This action cannot be undone. You will lose access to your volunteer
              history, requests, and any ongoing projects linked to this account.
            </p>
            <Button
              variant="destructive"
              className="w-full text-sm md:text-base py-3 rounded-lg flex items-center justify-center gap-2"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Confirm Account Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete your account? This action cannot
                be undone.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VolunteerSettings;
