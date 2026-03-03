-- Volunteer ratings: agencies rate volunteers on a project (1-5 stars)
-- Used to enforce "rate all volunteers before completing project"
CREATE TABLE IF NOT EXISTS public.volunteer_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  UNIQUE(project_id, volunteer_id)
);

CREATE INDEX IF NOT EXISTS idx_volunteer_ratings_project ON volunteer_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_ratings_volunteer ON volunteer_ratings(volunteer_id);

COMMENT ON TABLE public.volunteer_ratings IS 'Agency ratings of volunteers per project. One rating per volunteer per project.';

-- RLS
ALTER TABLE public.volunteer_ratings ENABLE ROW LEVEL SECURITY;

-- SELECT: agency (org or PM), volunteer (own rating), admin
CREATE POLICY "volunteer_ratings_select"
ON public.volunteer_ratings FOR SELECT
USING (
  public.is_admin()
  OR rater_id = auth.uid()
  OR volunteer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
    AND (p.organization_id = auth.uid() OR p.project_manager_id = auth.uid())
  )
);

-- INSERT: agency (org or PM) or admin only
CREATE POLICY "volunteer_ratings_insert"
ON public.volunteer_ratings FOR INSERT
WITH CHECK (
  public.is_admin()
  OR (
    rater_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
      AND (p.organization_id = auth.uid() OR p.project_manager_id = auth.uid())
    )
  )
);

-- UPDATE: rater or admin
CREATE POLICY "volunteer_ratings_update"
ON public.volunteer_ratings FOR UPDATE
USING (rater_id = auth.uid() OR public.is_admin());
