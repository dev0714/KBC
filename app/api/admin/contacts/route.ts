import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

// Upserts a contact record for any client account. Admin only.
export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const client_account_no = body.client_account_no
  if (!client_account_no) {
    return NextResponse.json({ error: 'client_account_no is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('contacts').upsert(
    {
      client_account_no,
      full_name: body.full_name ?? null,
      email: body.email ?? null,
      phone_number: body.phone_number ?? null,
      business_type: body.business_type ?? null,
    },
    { onConflict: 'client_account_no' },
  )

  if (error) {
    console.error('[admin/contacts] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
