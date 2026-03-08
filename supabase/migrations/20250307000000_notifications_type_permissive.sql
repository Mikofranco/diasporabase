-- Allow any non-empty notification type so DB triggers (e.g. on projects update) can insert
-- with their own type value without violating the check constraint.
-- Fixes: permission denied to set session_replication_role + trigger inserting unknown type

ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IS NOT NULL AND length(trim(type)) > 0);
