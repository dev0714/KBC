import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client authenticated with the service role key.
 *
 * The service role bypasses Row Level Security, so this client must ONLY be
 * used in server-side code (API routes / server actions) AFTER the caller has
 * been authorized via the session helpers. Never expose it to the browser.
 *
 * Throws if the service role key is not configured so that protected routes
 * fail closed rather than silently falling back to the anon key (which is
 * blocked by RLS).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role configuration')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
