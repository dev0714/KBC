-- ============================================================
-- PAYFAST SCHEMA
-- Creates the tables used by the payment creation and ITN flow
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payfast_payment_configs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id text NOT NULL UNIQUE,
  merchant_id text NOT NULL,
  merchant_key text NOT NULL,
  passphrase text NOT NULL,
  return_url text NOT NULL,
  cancel_url text NOT NULL,
  notify_url text NOT NULL,
  is_sandbox boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payfast_client_payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id text NOT NULL,
  payment_id text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  item_name text NOT NULL,
  item_description text,
  email_address text,
  cell_number text,
  name_first text,
  name_last text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payfast_client_payments_client_id ON public.payfast_client_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payfast_client_payments_status ON public.payfast_client_payments(status);

CREATE TABLE IF NOT EXISTS public.payfast_itn_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint REFERENCES public.orders(id) ON DELETE SET NULL,
  item_name text,
  name_first text,
  name_last text,
  signature text,
  amount_fee numeric,
  amount_net numeric,
  amount_gross numeric,
  custom_int1 text,
  custom_int2 text,
  custom_int3 text,
  custom_int4 text,
  custom_int5 text,
  custom_str1 text,
  custom_str2 text,
  custom_str3 text,
  custom_str4 text,
  custom_str5 text,
  merchant_id text,
  email_address text,
  pf_payment_id text,
  payment_status text,
  item_description text,
  m_payment_id text NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'received',
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE IF EXISTS public.payfast_itn_logs
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS name_first text,
  ADD COLUMN IF NOT EXISTS name_last text,
  ADD COLUMN IF NOT EXISTS signature text,
  ADD COLUMN IF NOT EXISTS amount_fee numeric,
  ADD COLUMN IF NOT EXISTS amount_net numeric,
  ADD COLUMN IF NOT EXISTS amount_gross numeric,
  ADD COLUMN IF NOT EXISTS custom_int1 text,
  ADD COLUMN IF NOT EXISTS custom_int2 text,
  ADD COLUMN IF NOT EXISTS custom_int3 text,
  ADD COLUMN IF NOT EXISTS custom_int4 text,
  ADD COLUMN IF NOT EXISTS custom_int5 text,
  ADD COLUMN IF NOT EXISTS custom_str1 text,
  ADD COLUMN IF NOT EXISTS custom_str2 text,
  ADD COLUMN IF NOT EXISTS custom_str3 text,
  ADD COLUMN IF NOT EXISTS custom_str4 text,
  ADD COLUMN IF NOT EXISTS custom_str5 text,
  ADD COLUMN IF NOT EXISTS merchant_id text,
  ADD COLUMN IF NOT EXISTS email_address text,
  ADD COLUMN IF NOT EXISTS item_description text;

CREATE INDEX IF NOT EXISTS idx_payfast_itn_logs_order_id ON public.payfast_itn_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payfast_itn_logs_m_payment_id ON public.payfast_itn_logs(m_payment_id);
CREATE INDEX IF NOT EXISTS idx_payfast_itn_logs_status ON public.payfast_itn_logs(processing_status);
