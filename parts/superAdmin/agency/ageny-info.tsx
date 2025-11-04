"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSendMail } from '@/services/mail'; // ← Your function

// Initialize Supabase client
const supabase = createClient();

// Define TypeScript interface for agency profile
interface AgencyProfile {
  id: string;
  organization_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  website: string | null;
  focus_areas: string[] | null;
  address: string | null;
  organization_type: string | null;
  description: string | null;
  environment_cities: string[] | null;
  environment_states: string[] | null;
  profile_picture: string | null;
  is_active: boolean;
}

// Zod schema
const profileSchema = z.object({
  organization_name: z.string().min(1, 'Organization name is required'),
  contact_person_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  contact_person_phone: z.string().optional().or(z.literal('')),
  website: z.string(),
  // .url('Invalid URL').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  organization_type: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  focus_areas: z.string().optional().or(z.literal('')),
  environment_cities: z.string().optional().or(z.literal('')),
  environment_states: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const AgencyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      organization_name: '',
      contact_person_email: '',
      contact_person_phone: '',
      website: '',
      address: '',
      organization_type: '',
      description: '',
      focus_areas: '',
      environment_cities: '',
      environment_states: '',
      is_active: true,
    },
  });

  // Watch current is_active value
  const currentActiveStatus = watch('is_active');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, organization_name, contact_person_email, contact_person_phone, website, focus_areas, address, organization_type, description, environment_cities, environment_states, profile_picture, is_active',
        )
        .eq('id', id)
        .eq('role', 'agency')
        .single();

      if (error) {
        setError('Failed to fetch agency profile');
        console.error(error);
      } else {
        setProfile(data);
        reset({
          organization_name: data.organization_name || '',
          contact_person_email: data.contact_person_email || '',
          contact_person_phone: data.contact_person_phone || '',
          website: data.website || '',
          address: data.address || '',
          organization_type: data.organization_type || '',
          description: data.description || '',
          focus_areas: data.focus_areas?.join(', ') || '',
          environment_cities: data.environment_cities?.join(', ') || '',
          environment_states: data.environment_states?.join(', ') || '',
          is_active: data.is_active ?? true,
        });
      }
      setLoading(false);
    };

    if (id) {
      fetchProfile();
    }
  }, [id, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const oldActiveStatus = profile?.is_active ?? true;
      const newActiveStatus = data.is_active;

      const updatedData = {
        organization_name: data.organization_name,
        contact_person_email: data.contact_person_email || null,
        contact_person_phone: data.contact_person_phone || null,
        website: data.website || null,
        address: data.address || null,
        organization_type: data.organization_type || null,
        description: data.description || null,
        focus_areas: data.focus_areas ? data.focus_areas.split(',').map((item) => item.trim()) : null,
        environment_cities: data.environment_cities ? data.environment_cities.split(',').map((item) => item.trim()) : null,
        environment_states: data.environment_states ? data.environment_states.split(',').map((item) => item.trim()) : null,
        is_active: newActiveStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', id)
        .eq('role', 'agency');

      if (error) throw error;

      setProfile({ ...profile!, ...updatedData });
      setIsModalOpen(false);

      toast({
        title: 'Success',
        description: 'Agency profile updated successfully',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      // --- SEND EMAIL IF is_active CHANGED ---
      if (oldActiveStatus !== newActiveStatus && data.contact_person_email) {
        const statusText = newActiveStatus ? 'activated' : 'deactivated';
        const subject = `Your Agency Account Has Been ${statusText === 'activated' ? 'Activated' : 'Deactivated'}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #1a73e8;">DiasporaBase</h2>
            <p>Dear <strong>${data.organization_name}</strong>,</p>
            <p>Your agency account has been <strong>${statusText}</strong>.</p>
            ${newActiveStatus
              ? `<p>You can now log in and add projects.</p>`
              : `<p>Your account is currently inactive. Contact support for more info.</p>`
            }
            <p style="margin-top: 20px;">Thank you,<br/>DiasporaBase Team</p>
          </div>
        `;

        await useSendMail({
          to: data.contact_person_email,
          subject,
          html,
          onSuccess: () => {
            toast({
              title: 'Email Sent',
              description: `Status change email sent to ${data.contact_person_email}`,
              className: 'bg-blue-50 border-blue-200 text-blue-800',
            });
          },
          onError: (msg) => {
            console.error("Failed to send status email:", msg);
            toast({
              title: 'Email Failed',
              description: 'Profile updated, but status email failed.',
              variant: 'destructive',
            });
          },
        });
      }
    } catch (err: any) {
      console.error("Update failed:", err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-lg mx-auto rounded-lg shadow-sm">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Agency not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              {profile.profile_picture ? (
                <Image
                  src={profile.profile_picture}
                  alt={`${profile.organization_name} profile picture`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/10"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-primary/10">
                  <span className="text-2xl font-semibold text-gray-500">
                    {profile.organization_name?.charAt(0) || 'A'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.organization_name || 'Unnamed Agency'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Agency Profile</p>
              </div>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2"
            >
              Edit Agency Info
            </Button>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <Badge variant={profile.is_active ? "default" : "secondary"}>
              {profile.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white shadow-sm rounded-lg p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Contact Details</h2>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <strong>Email:</strong> {profile.contact_person_email || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <strong>Phone:</strong> {profile.contact_person_phone || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <strong>Website:</strong>{' '}
                  {profile.website ? (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {profile.website}
                    </a>
                  ) : 'N/A'}
                </p>
                <p className="text-gray-600">
                  <strong>Type:</strong> {profile.organization_type || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <strong>Address:</strong> {profile.address || 'N/A'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Operations</h2>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <strong>Focus Areas:</strong> {profile.focus_areas?.join(', ') || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <strong>Cities:</strong> {profile.environment_cities?.join(', ') || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <strong>States:</strong> {profile.environment_states?.join(', ') || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <strong>Description:</strong> {profile.description || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Back to Agency List
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-lg bg-white p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Edit Agency Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {/* All form fields */}
              <div>
                <Label htmlFor="organization_name">Organization Name</Label>
                <Input id="organization_name" {...register('organization_name')} />
                {errors.organization_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.organization_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contact_person_email">Contact Email</Label>
                <Input id="contact_person_email" type="email" {...register('contact_person_email')} />
                {errors.contact_person_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_person_email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contact_person_phone">Contact Phone</Label>
                <Input id="contact_person_phone" {...register('contact_person_phone')} />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register('website')} />
                {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>}
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register('address')} />
              </div>

              <div>
                <Label htmlFor="organization_type">Organization Type</Label>
                <Input id="organization_type" {...register('organization_type')} />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} />
              </div>

              <div>
                <Label htmlFor="focus_areas">Focus Areas (comma-separated)</Label>
                <Input id="focus_areas" {...register('focus_areas')} />
              </div>

              <div>
                <Label htmlFor="environment_cities">Operating Cities</Label>
                <Input id="environment_cities" {...register('environment_cities')} />
              </div>

              <div>
                <Label htmlFor="environment_states">Operating States</Label>
                <Input id="environment_states" {...register('environment_states')} />
              </div>

              <div className="flex items-center space-x-3">
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active Status
                </Label>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="is_active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${field.value ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${field.value ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </Switch>
                  )}
                />
                <span className="text-sm font-medium">
                  {currentActiveStatus ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyProfile;