-- Add anonymous flag for volunteers (show/hide identity in public views)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS anonymous boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.anonymous IS 'When true, volunteer profile is shown anonymously (e.g. name/photo hidden).';
