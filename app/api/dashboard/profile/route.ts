import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

// Updates the logged-in user's own profile: upserts their contact record and
// syncs the matching fields onto their users row. Both the account number and
// the user id come from the session, so a user can only edit their own data.
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountNo = session.business_id
  if (!accountNo) return NextResponse.json({ error: 'No account on session' }, { status: 400 })

  const body = await request.json()
  const full_name = body.full_name || null
  const email = body.email || null
  const phone_number = body.phone_number || null
  const business_type = body.business_type || null

  const supabase = createServiceClient()

  const { error: contactError } = await supabase.from('contacts').upsert(
    {
      client_account_no: accountNo,
      full_name,
      email,
      phone_number,
      business_type,
    },
    { onConflict: 'client_account_no' },
  )

  if (contactError) {
    console.error('[profile] contact upsert error:', contactError)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  const { error: userError } = await supabase
    .from('users')
    .update({ email, full_name, phone_number, business_type })
    .eq('id', session.id)

  if (userError) {
    // Non-fatal: contact is the source of truth, login profile is a sync.
    console.error('[profile] user sync error:', userError)
  }

  return NextResponse.json({ success: true })
}
