
CREATE TABLE public.admin_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0
);

ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_admin_otps_email_created ON public.admin_otps (email, created_at DESC);
