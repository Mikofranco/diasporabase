-- Allow volunteers in a project to view, add, and update deliverables for that project.
-- RLS is already enabled on deliverables; we add policies that include volunteers.

-- Drop existing policies if they exist (names may vary; adjust if your dashboard used different names)
DROP POLICY IF EXISTS "Allow agency to manage deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Agency can manage project deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_select_policy" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_insert_policy" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_update_policy" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_delete_policy" ON public.deliverables;

-- Ensure RLS is enabled
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- Helper: true if current user is a volunteer registered for the project that owns this deliverable
CREATE OR REPLACE FUNCTION public.is_volunteer_in_deliverable_project(del_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_volunteers pv
    WHERE pv.project_id = del_project_id AND pv.volunteer_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_volunteer_in_deliverable_project(uuid) TO authenticated;

-- SELECT: agency owner, volunteer in project, or admin
CREATE POLICY "deliverables_select"
ON public.deliverables
FOR SELECT
USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
  OR public.is_volunteer_in_deliverable_project(project_id)
);

-- INSERT: agency owner, volunteer in project, or admin
CREATE POLICY "deliverables_insert"
ON public.deliverables
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
  OR public.is_volunteer_in_deliverable_project(project_id)
);

-- UPDATE: agency owner, volunteer in project, or admin
CREATE POLICY "deliverables_update"
ON public.deliverables
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
  OR public.is_volunteer_in_deliverable_project(project_id)
);

-- DELETE: agency owner, volunteer in project, or admin (volunteers can remove deliverables they added)
CREATE POLICY "deliverables_delete"
ON public.deliverables
FOR DELETE
USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = auth.uid())
  OR public.is_volunteer_in_deliverable_project(project_id)
);
