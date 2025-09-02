"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

const AgencyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, organization_name, contact_person_email, contact_person_phone, website, focus_areas, address, organization_type, description, environment_cities, environment_states, profile_picture',
        )
        .eq('id', id)
        .eq('role', 'agency')
        .single();

      if (error) {
        setError('Failed to fetch agency profile');
        console.error(error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Agency not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{profile.organization_name || 'Unnamed Agency'}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Details</h2>
          <p><strong>Contact Email:</strong> {profile.contact_person_email || 'N/A'}</p>
          <p><strong>Contact Phone:</strong> {profile.contact_person_phone || 'N/A'}</p>
          <p>
            <strong>Website:</strong>{' '}
            {profile.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {profile.website}
              </a>
            ) : (
              'N/A'
            )}
          </p>
          <p><strong>Organization Type:</strong> {profile.organization_type || 'N/A'}</p>
          <p><strong>Address:</strong> {profile.address || 'N/A'}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Additional Information</h2>
          <p><strong>Focus Areas:</strong> {profile.focus_areas?.join(', ') || 'N/A'}</p>
          <p><strong>Operating Cities:</strong> {profile.environment_cities?.join(', ') || 'N/A'}</p>
          <p><strong>Operating States:</strong> {profile.environment_states?.join(', ') || 'N/A'}</p>
          <p><strong>Description:</strong> {profile.description || 'N/A'}</p>
        </div>
      </div>
      {profile.profile_picture && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Profile Picture</h2>
          <img
            src={profile.profile_picture}
            alt={`${profile.organization_name} profile picture`}
            className="w-32 h-32 object-cover rounded-full"
          />
        </div>
      )}
      <Button
        variant="outline"
        className="mt-6"
        onClick={() => router.back()}
        aria-label="Go back"
      >
        Back to Agency List
      </Button>
    </div>
  );
};

export default AgencyProfile;