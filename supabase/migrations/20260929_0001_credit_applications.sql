-- Online credit application (digital version of the West Point Trading 55 CC
-- paper credit application form).

CREATE TABLE IF NOT EXISTS public.credit_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_review', 'approved', 'declined')),
  sales_rep text,
  registered_name text NOT NULL,
  trading_name text,
  registration_number text,
  vat_number text,
  entity_type text NOT NULL,
  credit_limit_requested numeric(14,2),
  buyer_email text,
  data jsonb NOT NULL,              -- full form payload (contacts, banking, owners, references)
  signature_png text NOT NULL,      -- data:image/png;base64 drawn signature
  signatory_name text NOT NULL,
  signed_date date,
  terms_version text NOT NULL,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{kind, name, size, type, path}]
  submitted_ip text,
  submitted_user_agent text,
  approved_credit_limit numeric(14,2),
  account_number text,
  admin_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_applications_created_idx ON public.credit_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS credit_applications_status_idx ON public.credit_applications (status);

-- RLS on with no policies: only the service-role API routes can read or write.
ALTER TABLE public.credit_applications ENABLE ROW LEVEL SECURITY;

-- Private bucket for supporting documents (ID copies, bank letters, CIPC docs).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'credit-applications',
  'credit-applications',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
