// app/agency/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { checkAgencyStatus } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { KeyRound, Bell, AlertTriangle, Loader2 } from 'lucide-react';

const supabase = createClient();
const CONFIRM_DELETE_TEXT = 'DELETE';

// Form schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Form setup with react-hook-form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setInitialLoading(true);
      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError || !userId) {
          toast.error('Please log in to view settings');
          setInitialLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, is_active, notification_preferences, receives_updates')
          .eq('id', userId)
          .single();

        if (profileError || !profile) {
          toast.error('Profile not found');
          setInitialLoading(false);
          return;
        }

        const agencyStatus = checkAgencyStatus({
          id: profile.id,
          role: profile.role,
          is_active: profile.is_active,
        });
        if (agencyStatus.status === 'error' || !agencyStatus.isAgencyActive) {
          toast.error(agencyStatus.message);
          setInitialLoading(false);
          return;
        }

        const prefs = profile.notification_preferences && typeof profile.notification_preferences === 'object'
          ? profile.notification_preferences
          : { email_notifications: true, sms_notifications: false };
        setSettings({
          notification_preferences: {
            email_notifications: prefs.email_notifications ?? true,
            sms_notifications: prefs.sms_notifications ?? false,
          },
          receives_updates: profile.receives_updates ?? false,
          is_active: profile.is_active ?? false,
        });
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handle password change
  const handlePasswordChange = async (data: PasswordFormData) => {
    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        toast.error('Please log in to change your password.');
        setSaving(false);
        return;
      }

      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });
      if (signInError) {
        toast.error('Current password is incorrect.');
        setSaving(false);
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (authError) {
        toast.error(`Failed to update password: ${authError.message}`);
        setSaving(false);
        return;
      }

      // Log notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        message: 'Password changed successfully',
        type: 'request_status_change',
        related_id: user.id,
      });

      toast.success('Password updated successfully');
      passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  // Handle settings update (notification preferences, receives_updates)
  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) {
      toast.error('No settings data to save');
      return;
    }
    setSaving(true);
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError || !userId) {
        toast.error('Please log in to save settings');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: settings.notification_preferences,
          receives_updates: settings.receives_updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        toast.error(`Failed to update settings: ${error.message}`);
      } else {
        await supabase.from('notifications').insert({
          user_id: userId,
          message: 'Notification settings updated',
          type: 'request_status_change',
          related_id: userId,
        });
        toast.success('Settings updated successfully');
      }
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== CONFIRM_DELETE_TEXT) return;
    setSaving(true);
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError || !userId) {
        toast.error('Please log in to continue');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        toast.error(`Failed to delete account: ${error.message}`);
      } else {
        await supabase.from('notifications').insert({
          user_id: userId,
          message: 'Account deletion requested',
          type: 'request_status_change',
          related_id: userId,
        });
        toast.success('Account deletion requested. Contact admin for finalization.');
        setDeleteDialogOpen(false);
        setDeleteConfirmText('');
      }
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setSaving(false);
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

  const sectionCardClass = 'shadow-md border border-gray-200/80 rounded-xl overflow-hidden';

  if (initialLoading || !settings) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div>
          <Skeleton className="h-8 w-48 rounded-lg mb-2" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Card className={sectionCardClass}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-4 w-full rounded mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </CardContent>
        </Card>
        <Card className={sectionCardClass}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-4 w-full rounded mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </CardContent>
        </Card>
        <Card className={sectionCardClass}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-28 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-32 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your password, notifications, and account.
        </p>
      </div>

      {/* Password */}
      <Card className={sectionCardClass}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-gray-500" />
            Change Password
          </CardTitle>
          <CardDescription>
            Set a new password. Use at least 8 characters with uppercase, number, and special character.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Current Password</FormLabel>
                    <FormControl>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter your current password"
                        className="h-9 text-sm border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
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
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">New Password</FormLabel>
                    <FormControl>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        className="h-9 text-sm border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
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
                        className="h-9 text-sm border-gray-300 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
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
                disabled={saving || !settings.is_active}
                className="h-9 text-sm action-btn rounded-lg disabled:opacity-70"
                aria-disabled={saving || !settings.is_active}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span className="ml-2">Updating...</span>
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className={sectionCardClass}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive updates and notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
                <Label htmlFor="email_notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Email Notifications
                </Label>
                <Switch
                  id="email_notifications"
                  checked={settings.notification_preferences.email_notifications}
                  onCheckedChange={(checked) => handleToggleChange('email_notifications', checked)}
                  disabled={!settings.is_active}
                  aria-label="Toggle email notifications"
                  className="data-[state=checked]:bg-[#0ea5e9] data-[state=checked]:hover:bg-[#0284c7]"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
                <Label htmlFor="sms_notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
                  SMS Notifications
                </Label>
                <Switch
                  id="sms_notifications"
                  checked={settings.notification_preferences.sms_notifications ?? false}
                  onCheckedChange={(checked) => handleToggleChange('sms_notifications', checked)}
                  disabled={!settings.is_active}
                  aria-label="Toggle SMS notifications"
                  className="data-[state=checked]:bg-[#0ea5e9] data-[state=checked]:hover:bg-[#0284c7]"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
                <Label htmlFor="receives_updates" className="text-sm font-medium text-gray-700 cursor-pointer">
                  General Updates
                </Label>
                <Switch
                  id="receives_updates"
                  checked={settings.receives_updates}
                  onCheckedChange={(checked) => handleToggleChange('receives_updates', checked)}
                  disabled={!settings.is_active}
                  aria-label="Toggle general updates"
                  className="data-[state=checked]:bg-[#0ea5e9] data-[state=checked]:hover:bg-[#0284c7]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-gray-600">
                Account status:{' '}
                <strong className={settings.is_active ? 'text-green-600' : 'text-amber-600'}>
                  {settings.is_active ? 'Active' : 'Pending'}
                </strong>
                {!settings.is_active && (
                  <span className="text-muted-foreground text-xs ml-1">(Contact admin if you need access)</span>
                )}
              </p>
              <Button
                type="submit"
                disabled={saving || !settings.is_active}
                className="h-9 text-sm action-btn rounded-lg disabled:opacity-70"
                aria-disabled={saving || !settings.is_active}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="shadow-md border border-red-200/80 rounded-xl overflow-hidden bg-red-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Deleting your account is irreversible. You will lose access to all projects and data. Contact admin for finalization after requesting deletion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirmText(''); }}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="h-9 text-sm rounded-lg hover:bg-red-700"
              >
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600">Confirm Account Deletion</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Type <strong>{CONFIRM_DELETE_TEXT}</strong> below to confirm.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <Input
                  placeholder={`Type ${CONFIRM_DELETE_TEXT} to confirm`}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="border-red-200 focus-visible:ring-red-500 rounded-lg font-mono"
                  aria-label="Confirmation text"
                />
              </div>
              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); }}
                  className="h-9 text-sm rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={saving || deleteConfirmText !== CONFIRM_DELETE_TEXT}
                  className="h-9 text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span className="ml-2">Deleting...</span>
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}