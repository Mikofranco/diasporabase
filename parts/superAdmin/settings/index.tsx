"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, User, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import SkillsetManagementPage from './skillSetManagent';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  notification_preferences: { email_notifications: boolean };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  email_notifications: z.boolean(),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

const AdminSettings: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState<boolean>(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState<boolean>(false);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      email_notifications: true,
    },
  });

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, notification_preferences')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (!['admin', 'super_admin'].includes(profileData.role)) {
          toast.error('You do not have permission to access this page.');
          setLoading(false);
          return;
        }

        setProfile(profileData);
        profileForm.setValue('full_name', profileData.full_name || '');
        profileForm.setValue('email', profileData.email || '');
        profileForm.setValue('email_notifications', profileData.notification_preferences?.email_notifications ?? true);
      } catch (err) {
        toast.error('Error fetching profile: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, [router, profileForm]);

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSubmittingPassword(true);
    try {
      // Sign in to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: data.currentPassword,
      });

      if (signInError) throw new Error('Current password is incorrect');

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Password updated successfully.');
      passwordForm.reset();
    } catch (err) {
      toast.error('Error updating password: ' + (err as Error).message);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSubmittingProfile(true);
    try {
      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          notification_preferences: { email_notifications: data.email_notifications },
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (profileError) throw profileError;

      // Update email in auth.users if changed
      if (data.email !== profile?.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: data.email,
        });
        if (authError) throw authError;
      }

      setProfile((prev) =>
        prev ? { ...prev, full_name: data.full_name, email: data.email, notification_preferences: { email_notifications: data.email_notifications } } : null
      );
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error('Error updating profile: ' + (err as Error).message);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Password Change Section */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
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
                  control={passwordForm.control}
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
                  control={passwordForm.control}
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
                  disabled={isSubmittingPassword}
                >
                  {isSubmittingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Password'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Profile Update Section */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <User className="h-4 w-4" /> Full Name
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
                  control={profileForm.control}
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
                  control={profileForm.control}
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
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 transition-all duration-300"
                  disabled={isSubmittingProfile}
                >
                  {isSubmittingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <SkillsetManagementPage />
    </div>
  );
};

export default AdminSettings;