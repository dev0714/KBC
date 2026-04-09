-- ============================================================
-- PAYFAST ITN LOGS
-- Stores every incoming ITN payload for auditing/debugging
-- ============================================================

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
