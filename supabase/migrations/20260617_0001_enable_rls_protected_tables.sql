-- Enable Row Level Security on tables that were fully exposed to the anon /
-- authenticated roles (anyone with the public anon key could read/write them).
--
-- This app does NOT use Supabase Auth: authorization is enforced in the Next.js
-- API layer, which accesses these tables with the service role key. The service
-- role bypasses RLS, so enabling RLS with NO policies locks these tables down to
-- server-side access only (deny-all for anon/authenticated) without breaking the
-- application.
--
-- IMPORTANT: Apply this migration only AFTER the matching application code (which
-- moves all browser-side reads/writes of these tables behind service-role API
-- routes) has been deployed. Applying it against a deployment that still queries
-- these tables with the anon key from the browser will break those features.

ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payfast_itn_logs ENABLE ROW LEVEL SECURITY;
