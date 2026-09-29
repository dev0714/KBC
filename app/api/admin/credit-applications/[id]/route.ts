import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

const BUCKET = 'credit-applications'
const STATUSES = ['new', 'in_review', 'approved', 'declined'] as const

type StoredDoc = { kind: string; name: string; size: number; type: string; path: string }

// GET   -> full application incl. signature and 10-minute download links
// PATCH -> status / approved limit / account number / notes
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const db = createServiceClient()
  const { data, error } = await db.from('credit_applications').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Failed to load application' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Which declared files actually arrived in storage (uploads can fail client-side).
  const listing = await db.storage.from(BUCKET).list(id, { limit: 100 })
  const present = new Set((listing.data ?? []).map((f) => `${id}/${f.name}`))

  const docs = (data.documents as StoredDoc[]) ?? []
  const documents = await Promise.all(
    docs.map(async (d) => {
      if (!present.has(d.path)) return { ...d, uploaded: false, url: null }
      const signed = await db.storage.from(BUCKET).createSignedUrl(d.path, 600, { download: d.name })
      return { ...d, uploaded: true, url: signed.data?.signedUrl ?? null }
    }),
  )

  return NextResponse.json({ application: { ...data, documents } })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const body = await request.json().catch(() => ({}))
  const update: Record<string, unknown> = {}

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    update.status = body.status
    update.reviewed_by = admin.email
    update.reviewed_at = new Date().toISOString()
  }
  if (body.approvedCreditLimit !== undefined) {
    const n = body.approvedCreditLimit === '' || body.approvedCreditLimit === null ? null : Number(body.approvedCreditLimit)
    if (n !== null && !(n >= 0)) return NextResponse.json({ error: 'Invalid credit limit' }, { status: 400 })
    update.approved_credit_limit = n
  }
  if (body.accountNumber !== undefined) update.account_number = String(body.accountNumber ?? '').trim().slice(0, 50) || null
  if (body.adminNotes !== undefined) update.admin_notes = String(body.adminNotes ?? '').slice(0, 5000) || null

  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db.from('credit_applications').update(update).eq('id', id)
  if (error) {
    console.error('[credit-applications] update failed', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
