// app/lib/database.types.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // uuid
          full_name: string | null;
          email: string | null;
          role: 'super_admin' | 'admin' | 'volunteer' | 'agency';
          phone: string | null;
          date_of_birth: string | null; // date stored as string in TypeScript
          address: string | null;
          skills: string[] | null;
          availability: string | null;
          experience: string | null;
          residence_country: string | null;
          residence_state: string | null;
          origin_country: string | null;
          origin_state: string | null;
          origin_lga: string | null;
          organization_name: string | null;
          contact_person_first_name: string | null;
          contact_person_last_name: string | null;
          contact_person_email: string | null;
          contact_person_phone: string | null;
          website: string | null;
          organization_type: string | null;
          description: string | null;
          tax_id: string | null;
          focus_areas: string[] | null;
          environment_cities: string[] | null;
          environment_states: string[] | null;
          volunteer_countries: string[] | null;
          volunteer_states: string[] | null;
          volunteer_lgas: string[] | null;
          receives_updates: boolean;
          is_active: boolean;
          profile_picture: string | null;
          updated_at: string | null; // timestamp with time zone
          notification_preferences: { email_notifications: boolean } | null;
          deleted_at: string | null; // timestamp with time zone
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role: 'super_admin' | 'admin' | 'volunteer' | 'agency';
          phone?: string | null;
          date_of_birth?: string | null;
          address?: string | null;
          skills?: string[] | null;
          availability?: string | null;
          experience?: string | null;
          residence_country?: string | null;
          residence_state?: string | null;
          origin_country?: string | null;
          origin_state?: string | null;
          origin_lga?: string | null;
          organization_name?: string | null;
          contact_person_first_name?: string | null;
          contact_person_last_name?: string | null;
          contact_person_email?: string | null;
          contact_person_phone?: string | null;
          website?: string | null;
          organization_type?: string | null;
          description?: string | null;
          tax_id?: string | null;
          focus_areas?: string[] | null;
          environment_cities?: string[] | null;
          environment_states?: string[] | null;
          volunteer_countries?: string[] | null;
          volunteer_states?: string[] | null;
          volunteer_lgas?: string[] | null;
          receives_updates?: boolean;
          is_active?: boolean;
          profile_picture?: string | null;
          updated_at?: string | null;
          notification_preferences?: { email_notifications: boolean } | null;
          deleted_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          email?: string | null;
          role?: 'super_admin' | 'admin' | 'volunteer' | 'agency';
          phone?: string | null;
          date_of_birth?: string | null;
          address?: string | null;
          skills?: string[] | null;
          availability?: string | null;
          experience?: string | null;
          residence_country?: string | null;
          residence_state?: string | null;
          origin_country?: string | null;
          origin_state?: string | null;
          origin_lga?: string | null;
          organization_name?: string | null;
          contact_person_first_name?: string | null;
          contact_person_last_name?: string | null;
          contact_person_email?: string | null;
          contact_person_phone?: string | null;
          website?: string | null;
          organization_type?: string | null;
          description?: string | null;
          tax_id?: string | null;
          focus_areas?: string[] | null;
          environment_cities?: string[] | null;
          environment_states?: string[] | null;
          volunteer_countries?: string[] | null;
          volunteer_states?: string[] | null;
          volunteer_lgas?: string[] | null;
          receives_updates?: boolean;
          is_active?: boolean;
          profile_picture?: string | null;
          updated_at?: string | null;
          notification_preferences?: { email_notifications: boolean } | null;
          deleted_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string; // uuid
          user_id: string;
          message: string;
          type: 'request_status_change' | 'project_approval' | 'new_agency' | 'new_project';
          related_id: string | null;
          is_read: boolean;
          created_at: string; // timestamp with time zone
        };
      };
      // Add other tables as needed (e.g., projects, volunteer_requests)
    };
  };
}