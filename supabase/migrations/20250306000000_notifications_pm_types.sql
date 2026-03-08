-- Allow PM-related notification types so triggers or app code can insert when PM invite is accepted/rejected.
-- Fixes: new row for relation "notifications" violates check constraint "notifications_type_check"
-- Existing rows with other type values are normalized so the new constraint can be applied.

ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Normalize any existing rows whose type is not in the new allowed list (so the new constraint passes)
UPDATE public.notifications
SET type = 'request_status_change'
WHERE type IS NULL
   OR type NOT IN (
  'request_status_change',
  'project_approval',
  'new_agency',
  'new_project',
  'pm_invite',
  'pm_role_accepted',
  'pm_role_rejected',
  'project_manager_assigned',
  'pm_request'
);

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'request_status_change',
  'project_approval',
  'new_agency',
  'new_project',
  'pm_invite',
  'pm_role_accepted',
  'pm_role_rejected',
  'project_manager_assigned',
  'pm_request'
));
