// app/agency/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { checkAgencyStatus } from '@/lib/utils';

const supabase = createClient();

// Form schema for password change
const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface Settings {
  notification_preferences: { email_notifications: boolean; sms_notifications?: boolean };
  receives_updates: boolean;
  is_active: boolean;
}

export default function AgencySettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form setup with react-hook-form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          toast.error('Unauthorized: Please log in');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, is_active, notification_preferences, receives_updates')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          toast.error('Profile not found');
          return;
        }

        const agencyStatus = checkAgencyStatus({
          id: profile.id,
          role: profile.role,
          is_active: profile.is_active,
        });
        if (agencyStatus.status === 'error' || !agencyStatus.isAgencyActive) {
          toast.error(agencyStatus.message);
          return;
        }

        setSettings({
          notification_preferences: profile.notification_preferences,
          receives_updates: profile.receives_updates,
          is_active: profile.is_active,
        });
      } catch (err: any) {
        toast.error('Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

  // Handle password change
  const handlePasswordChange = async (data: PasswordFormData) => {
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (authError) {
        toast.error(`Failed to update password: ${authError.message}`);
        return;
      }

      // Log notification (FR-301)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          message: 'Password changed successfully',
          type: 'request_status_change',
          related_id: user.id,
        });
      }

      toast.success('Password updated successfully');
      passwordForm.reset();
    } catch (err: any) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Handle settings update (notification preferences, receives_updates)
  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!settings) {
      toast.error('No settings data to save');
      setLoading(false);
      return;
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Unauthorized: Please log in');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: settings.notification_preferences,
          receives_updates: settings.receives_updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        toast.error(`Failed to update settings: ${error.message}`);
      } else {
        // Log notification (FR-301)
        await supabase.from('notifications').insert({
          user_id: user.id,
          message: 'Notification settings updated',
          type: 'request_status_change',
          related_id: user.id,
        });
        toast.success('Settings updated successfully');
      }
    } catch (err: any) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Unauthorized: Please log in');
        setLoading(false);
        return;
      }

      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        toast.error(`Failed to delete account: ${error.message}`);
      } else {
        // Log notification (FR-301)
        await supabase.from('notifications').insert({
          user_id: user.id,
          message: 'Account deletion requested',
          type: 'request_status_change',
          related_id: user.id,
        });
        toast.success('Account deletion requested. Contact admin for finalization.');
        setDeleteDialogOpen(false);
      }
    } catch (err: any) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle changes
  const handleToggleChange = (name: string, checked: boolean) => {
    if (name === 'receives_updates') {
      setSettings((prev) => (prev ? { ...prev, receives_updates: checked } : prev));
    } else {
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              notification_preferences: {
                ...prev.notification_preferences,
                [name]: checked,
              },
            }
          : prev
      );
    }
  };

  if (!settings) {
    return <div className="container mx-auto p-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      {/* Password Change Card */}
      <Card className="shadow-md rounded-lg animate-fade-in">
        <CardHeader className="py-3">
          <CardTitle className="text-lg font-semibold text-gray-800">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-3">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">New Password</FormLabel>
                    <FormControl>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        className="h-9 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        className="h-9 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={loading || !settings.is_active}
                className="h-9 text-sm action-btn transition-colors disabled:bg-gray-400"
                aria-disabled={loading || !settings.is_active}
              >
                {loading ? 'Saving...' : 'Change Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Notification Preferences Card */}
      <Card className="shadow-md rounded-lg animate-fade-in">
        <CardHeader className="py-3">
          <CardTitle className="text-lg font-semibold text-gray-800">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSettingsSubmit} className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email_notifications" className="text-sm font-medium text-gray-700">
                  Email Notifications
                </Label>
                <Switch
                  id="email_notifications"
                  checked={settings.notification_preferences.email_notifications}
                  onCheckedChange={(checked) => handleToggleChange('email_notifications', checked)}
                  disabled={!settings.is_active}
                  aria-label="Toggle email notifications"
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms_notifications" className="text-sm font-medium text-gray-700">
                  SMS Notifications
                </Label>
                <Switch
                  id="sms_notifications"
                  checked={settings.notification_preferences.sms_notifications || false}
                  onCheckedChange={(checked) => handleToggleChange('sms_notifications', checked)}
                  disabled={!settings.is_active}
                  aria-label="Toggle SMS notifications"
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="receives_updates" className="text-sm font-medium text-gray-700">
                  General Updates
                </Label>
                <Switch
                  id="receives_updates"
                  checked={settings.receives_updates}
                  onCheckedChange={(checked) => handleToggleChange('receives_updates', checked)}
                  disabled={!settings.is_active}
                  aria-label="Toggle general updates"
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Account Status: <strong className={settings.is_active ? 'text-green-600' : 'text-red-600'}>{settings.is_active ? 'Active' : 'Inactive'}</strong>
                {!settings.is_active && (
                  <span className="text-gray-500 text-xs ml-1">
                    (Contact admin for verification)
                  </span>
                )}
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading || !settings.is_active}
              className="h-9 text-sm action-btn transition-colors disabled:bg-gray-400"
              aria-disabled={loading || !settings.is_active}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="shadow-md rounded-lg border border-red-200 animate-fade-in">
        <CardHeader className="py-3">
          <CardTitle className="text-lg font-semibold text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            Deleting your account is irreversible. You will lose access to all projects and data.
          </p>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="h-9 text-sm hover:bg-red-700 transition-colors"
              >
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600">Confirm Account Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete your account? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="h-9 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="h-9 text-sm hover:bg-red-700 transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}