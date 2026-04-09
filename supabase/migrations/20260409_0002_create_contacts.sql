-- Contacts schema for KBC
-- One contact record per client account.

CREATE TABLE IF NOT EXISTS public.contacts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_account_no text NOT NULL UNIQUE REFERENCES public.clients(account_no) ON DELETE CASCADE,
  full_name text,
  email text,
  phone_number text,
  business_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_client_account_no
  ON public.contacts(client_account_no);

CREATE INDEX IF NOT EXISTS idx_contacts_email
  ON public.contacts(email);

INSERT INTO public.contacts (client_account_no, full_name, email, phone_number, business_type)
SELECT DISTINCT
  u.business_id,
  u.full_name,
  u.email,
  u.phone_number,
  u.business_type
FROM public.users u
WHERE u.role = 'client'
  AND u.business_id IS NOT NULL
ON CONFLICT (client_account_no) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, public.contacts.full_name),
  email = COALESCE(EXCLUDED.email, public.contacts.email),
  phone_number = COALESCE(EXCLUDED.phone_number, public.contacts.phone_number),
  business_type = COALESCE(EXCLUDED.business_type, public.contacts.business_type),
  updated_at = now();
