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
  m_payment_id text NOT NULL,
  pf_payment_id text,
  payment_status text,
  amount_gross numeric,
  amount_fee numeric,
  amount_net numeric,
  signature text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'received',
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payfast_itn_logs_order_id ON public.payfast_itn_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payfast_itn_logs_m_payment_id ON public.payfast_itn_logs(m_payment_id);
CREATE INDEX IF NOT EXISTS idx_payfast_itn_logs_status ON public.payfast_itn_logs(processing_status);
