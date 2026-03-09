-- Enable RLS on email_confirmation_logs so only service role (server-side) can access.
-- service_role bypasses RLS; anon and authenticated have no policies so they cannot access.
ALTER TABLE public.email_confirmation_logs ENABLE ROW LEVEL SECURITY;
