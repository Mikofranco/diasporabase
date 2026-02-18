-- Profile: track resend attempts for rate limiting (2 min per user)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_resend_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resend_at TIMESTAMPTZ;

-- Email confirmation logs for admin and debugging
CREATE TABLE IF NOT EXISTS email_confirmation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'invalid_email')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_confirmation_logs_user_id ON email_confirmation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_logs_email ON email_confirmation_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_logs_status ON email_confirmation_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_logs_created_at ON email_confirmation_logs(created_at DESC);

COMMENT ON TABLE email_confirmation_logs IS 'Tracks confirmation email send attempts for admin review and debugging';
