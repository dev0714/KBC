import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

// GET -> credit application summaries, newest first (no signature / full payload).
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('credit_applications')
    .select(
      'id, reference, status, sales_rep, registered_name, trading_name, entity_type, credit_limit_requested, buyer_email, signatory_name, documents, created_at, reviewed_at',
    )
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) {
    console.error('[credit-applications] list failed', error)
    return NextResponse.json({ error: 'Failed to load credit applications' }, { status: 500 })
  }
  return NextResponse.json({
    applications: (data ?? []).map(({ documents, ...a }) => ({
      ...a,
      documentCount: Array.isArray(documents) ? documents.length : 0,
    })),
  })
}
