-- Add optional assignee (volunteer user id) to deliverables
ALTER TABLE public.deliverables
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deliverables_assigned_to ON public.deliverables(assigned_to);
COMMENT ON COLUMN public.deliverables.assigned_to IS 'Optional volunteer (user id) assigned to this deliverable.';
