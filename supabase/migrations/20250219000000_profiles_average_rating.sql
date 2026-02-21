-- Add average_rating to profiles (e.g. for volunteers; computed from ratings, 0–5)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS average_rating real DEFAULT 0;

COMMENT ON COLUMN public.profiles.average_rating IS 'Average star rating (0–5). For volunteers, can be maintained from project_ratings or similar.';
