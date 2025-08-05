-- Create the 'profiles' table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text UNIQUE, -- Redundant with auth.users, but useful for quick lookups
  role text CHECK (role IN ('admin', 'volunteer', 'agency')),
  phone text,
  date_of_birth date,
  address text,
  skills text[], -- For volunteers
  availability text, -- For volunteers: 'full-time' or JSON string of dates
  experience text, -- For volunteers
  residence_country text, -- Auto-tracked for volunteers
  residence_state text, -- Auto-tracked for volunteers
  origin_country text, -- For volunteers
  origin_state text, -- For volunteers
  origin_lga text, -- For volunteers
  volunteer_country text, -- For volunteers
  volunteer_state text, -- For volunteers
  volunteer_lga text, -- For volunteers
  organization_name text, -- For agencies
  contact_person_first_name text, -- For agencies
  contact_person_last_name text, -- For agencies
  contact_person_email text, -- For agencies
  contact_person_phone text, -- For agencies
  website text, -- For agencies
  organization_type text, -- For agencies
  description text, -- For agencies
  tax_id text, -- For agencies
  focus_areas text[], -- For agencies
  environment_cities text[], -- For agencies
  environment_states text[], -- For agencies
  receives_updates boolean DEFAULT FALSE -- For agencies
);

-- Create the 'projects' table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  organization_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Link to agency profile
  organization_name text NOT NULL, -- Denormalized for easier public display
  location text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  volunteers_needed integer NOT NULL,
  volunteers_registered integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'pending', 'cancelled')),
  category text NOT NULL
);

-- Create the 'project_ratings' table
CREATE TABLE IF NOT EXISTS public.project_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional: link to user who rated
  user_name text NOT NULL, -- Name of the person leaving the review
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text
  email text;
);
