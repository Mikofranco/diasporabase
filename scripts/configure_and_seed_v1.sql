-- Enable Row Level Security (RLS) on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts during re-creation
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to delete profiles." ON public.profiles;

DROP POLICY IF EXISTS "Allow public read access to active projects." ON public.projects;
DROP POLICY IF EXISTS "Allow agencies to insert their own projects." ON public.projects;
DROP POLICY IF EXISTS "Allow agencies to update their own projects." ON public.projects;
DROP POLICY IF EXISTS "Allow agencies to delete their own projects." ON public.projects;
DROP POLICY IF EXISTS "Allow admins to manage all projects." ON public.projects;

DROP POLICY IF EXISTS "Allow public read access to project ratings." ON public.project_ratings;
DROP POLICY IF EXISTS "Allow authenticated users to insert ratings." ON public.project_ratings;
DROP POLICY IF EXISTS "Allow users to update their own ratings." ON public.project_ratings;
DROP POLICY IF EXISTS "Allow users to delete their own ratings." ON public.project_ratings;
DROP POLICY IF EXISTS "Allow admins to delete all ratings." ON public.project_ratings;

-- Drop existing trigger if it exists to prevent conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a helper function to check if the current user is an admin
-- This function runs with SECURITY DEFINER to bypass RLS on profiles table itself
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
  BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
  END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- RLS Policies for 'profiles' table
CREATE POLICY "Allow authenticated users to view their own profile." ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to insert their own profile." ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own profile." ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Updated: Use is_admin() function to avoid recursion
CREATE POLICY "Allow admins to view all profiles." ON public.profiles
FOR SELECT USING (public.is_admin());

-- Updated: Use is_admin() function to avoid recursion
CREATE POLICY "Allow admins to delete profiles." ON public.profiles
FOR DELETE USING (public.is_admin());

-- RLS Policies for 'projects' table
CREATE POLICY "Allow public read access to active projects." ON public.projects
FOR SELECT USING (status = 'active');

CREATE POLICY "Allow agencies to insert their own projects." ON public.projects
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'agency') AND organization_id = auth.uid());

CREATE POLICY "Allow agencies to update their own projects." ON public.projects
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'agency') AND organization_id = auth.uid());

-- Updated: Use is_admin() function for admin part
CREATE POLICY "Allow agencies to delete their own projects." ON public.projects
FOR DELETE USING (public.is_admin() OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'agency') AND organization_id = auth.uid()));

-- Updated: Use is_admin() function for admin part
CREATE POLICY "Allow admins to manage all projects." ON public.projects
FOR ALL USING (public.is_admin());

-- RLS Policies for 'project_ratings' table
CREATE POLICY "Allow public read access to project ratings." ON public.project_ratings
FOR SELECT USING (true); -- Anyone can read ratings

CREATE POLICY "Allow authenticated users to insert ratings." ON public.project_ratings
FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- Any authenticated user can insert

CREATE POLICY "Allow users to update their own ratings." ON public.project_ratings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own ratings." ON public.project_ratings
FOR DELETE USING (auth.uid() = user_id);

-- Updated: Use is_admin() function for admin part
CREATE POLICY "Allow admins to delete all ratings." ON public.project_ratings
FOR DELETE USING (public.is_admin());

-- Set up a trigger to automatically create a profile entry for new users
-- This function creates a new profile for a user after they sign up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO public.profiles (id, full_name, role) -- Corrected: now inserts full_name and role
VALUES (
  NEW.id,
  NEW.raw_user_meta_data ->> 'full_name',
  NEW.raw_user_meta_data ->> 'role'
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions to the 'authenticated' role
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.project_ratings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant necessary permissions to the 'anon' role for public access
GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.project_ratings TO anon;

-- Clear existing data before seeding to prevent conflicts
TRUNCATE TABLE public.project_ratings RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.projects RESTART IDENTITY CASCADE;

-- Seed some example projects for public viewing and rating
-- NOTE: These projects are are not linked to any specific organization_id.
-- In a real scenario, you would insert projects with a valid organization_id
-- from an existing agency profile. For demonstration, we'll use a placeholder UUID.
INSERT INTO public.projects (id, title, description, organization_id, organization_name, location, start_date, end_date, volunteers_needed, volunteers_registered, status, category)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Community Garden Cleanup', 'Help us revitalize the local community garden by weeding, planting, and general maintenance.', NULL, 'Green Earth Alliance', 'Lagos, Nigeria', '2025-08-15', '2025-08-17', 15, 5, 'active', 'Environmental'),
('b1cdef00-0d1c-4ef8-bb6d-6bb9bd380a11', 'Elderly Care Support', 'Provide companionship and assistance with daily tasks for elderly residents in our care home.', NULL, 'Golden Years Foundation', 'Nairobi, Kenya', '2025-09-01', '2025-12-31', 10, 3, 'active', 'Social Services'),
('c2def111-1e2d-4ff0-dd8f-8dd1df502c33', 'Literacy Program for Children', 'Assist in teaching reading and writing to underprivileged children after school hours.', NULL, 'Future Scholars Initiative', 'Accra, Ghana', '2025-10-01', '2026-03-31', 8, 2, 'active', 'Education'),
('d3ef2222-2f3e-4ff1-ee90-9ee2ef613d44', 'Beach Cleanup Drive', 'Join us to clean up our beautiful coastline and protect marine life.', NULL, 'Green Earth Alliance', 'Mombasa, Kenya', '2025-08-20', '2025-08-20', 25, 10, 'active', 'Environmental'),
('e4f03333-304f-4ff2-ff01-a0f3f7224e55', 'Food Distribution for Homeless', 'Help us prepare and distribute meals to homeless individuals in the city center.', NULL, 'Golden Years Foundation', 'Johannesburg, South Africa', '2025-09-10', '2025-09-10', 12, 7, 'active', 'Social Services');

-- Seed some example ratings for the projects
INSERT INTO public.project_ratings (project_id, user_id, user_name, rating, comment)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'Alice Johnson', 5, 'Fantastic experience! The garden looks amazing.'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'Bob Williams', 4, 'Well organized, but it was very hot. Still, a great cause!'),
('b1cdef00-0d1c-4ef8-bb6d-6bb9bd380a11', NULL, 'Charlie Brown', 5, 'Heartwarming work. The elderly residents were lovely.'),
('c2def111-1e2d-4ff0-dd8f-8dd1df502c33', NULL, 'Diana Prince', 5, 'So rewarding to see the children learn and grow.'),
('d3ef2222-2f3e-4ff1-ee90-9ee2ef613d44', NULL, 'Eve Adams', 4, 'Great initiative, but more gloves were needed.'),
('e4f03333-304f-4ff2-ff01-a0f3f7224e55', NULL, 'Frank Green', 5, 'Efficient and impactful. Glad to help those in need.');
