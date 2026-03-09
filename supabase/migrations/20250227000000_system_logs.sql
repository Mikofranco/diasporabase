-- System logs table: audit trail for super_admin (projects, profiles, applications, etc.)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- What happened
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb,

  -- Who did it
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_role text,

  -- Optional: link to related entity (e.g. project_id for application events)
  meta jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity ON public.system_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_actor ON public.system_logs (actor_id);

COMMENT ON TABLE public.system_logs IS 'Audit log for system activity (project status, applications, profile changes). Readable by super_admin only.';

-- RLS: only super_admin can read
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_select_system_logs"
  ON public.system_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- super_admin and admin can insert (so admin actions like approve/reject get logged)
CREATE POLICY "admin_insert_system_logs"
  ON public.system_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Allow service role full access for server-side logging
CREATE POLICY "service_all_system_logs"
  ON public.system_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
