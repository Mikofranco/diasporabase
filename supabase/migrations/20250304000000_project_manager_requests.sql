-- Project Manager role requests: volunteer must already be on the project; agency sends PM role request; volunteer accepts/rejects.
-- Max 2 PMs per project: project_manager_id (first), project_manager_2_id (second).

-- Add second PM slot to projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_manager_2_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.projects.project_manager_2_id IS 'Second project manager (max 2 PMs per project).';

-- Table: PM role requests (not "join project" requests)
CREATE TABLE IF NOT EXISTS public.project_manager_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, volunteer_id)
);

CREATE INDEX IF NOT EXISTS idx_pm_requests_project ON public.project_manager_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_requests_volunteer ON public.project_manager_requests(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_pm_requests_status ON public.project_manager_requests(status);

ALTER TABLE public.project_manager_requests ENABLE ROW LEVEL SECURITY;

-- Agency (project owner) can create and read PM requests for their projects
CREATE POLICY "pm_requests_org_insert"
ON public.project_manager_requests FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
);

CREATE POLICY "pm_requests_org_select"
ON public.project_manager_requests FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
  OR volunteer_id = auth.uid()
);

-- Volunteer can update only their own request (accept/reject)
CREATE POLICY "pm_requests_volunteer_update"
ON public.project_manager_requests FOR UPDATE
USING (volunteer_id = auth.uid())
WITH CHECK (volunteer_id = auth.uid());

-- Milestones: allow project managers (either slot) to insert/update/delete for their project
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'milestones') THEN
    ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "milestones_pm_insert" ON public.milestones;
    CREATE POLICY "milestones_pm_insert"
    ON public.milestones FOR INSERT
    WITH CHECK (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.project_manager_id = auth.uid() OR p.project_manager_2_id = auth.uid()))
    );

    DROP POLICY IF EXISTS "milestones_pm_select" ON public.milestones;
    CREATE POLICY "milestones_pm_select"
    ON public.milestones FOR SELECT
    USING (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.project_manager_id = auth.uid() OR p.project_manager_2_id = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.project_volunteers pv WHERE pv.project_id = milestones.project_id AND pv.volunteer_id = auth.uid())
    );

    DROP POLICY IF EXISTS "milestones_pm_update" ON public.milestones;
    CREATE POLICY "milestones_pm_update"
    ON public.milestones FOR UPDATE
    USING (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.project_manager_id = auth.uid() OR p.project_manager_2_id = auth.uid()))
    );

    DROP POLICY IF EXISTS "milestones_pm_delete" ON public.milestones;
    CREATE POLICY "milestones_pm_delete"
    ON public.milestones FOR DELETE
    USING (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.project_manager_id = auth.uid() OR p.project_manager_2_id = auth.uid()))
    );
  END IF;
END $$;
