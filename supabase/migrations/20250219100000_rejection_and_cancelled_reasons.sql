-- Rejection reasons (used when super admin rejects a project)
CREATE TABLE IF NOT EXISTS public.rejection_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason_text text NOT NULL,
  internal_note text,
  organization_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rejection_reasons_project_id ON public.rejection_reasons(project_id);

-- Cancelled reason on project (when project is cancelled)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS cancelled_reason text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

COMMENT ON COLUMN public.projects.cancelled_reason IS 'Reason for cancellation when status is cancelled.';
COMMENT ON COLUMN public.projects.cancelled_at IS 'When the project was cancelled.';
