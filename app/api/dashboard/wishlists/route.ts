import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

// All operations are scoped to the logged-in user's own client account
// (derived from the session, never trusted from the request body).

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountNo = session.business_id
  if (!accountNo) return NextResponse.json({ skus: [] })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('wishlists')
    .select('sku')
    .eq('account_no', accountNo)

  if (error) {
    console.error('[wishlists] GET error:', error)
    return NextResponse.json({ error: 'Failed to load wishlist' }, { status: 500 })
  }

  return NextResponse.json({ skus: (data || []).map((row) => row.sku) })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountNo = session.business_id
  if (!accountNo) return NextResponse.json({ error: 'No account on session' }, { status: 400 })

  const { sku } = await request.json()
  if (!sku) return NextResponse.json({ error: 'sku is required' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('wishlists').insert({ account_no: accountNo, sku })

  if (error) {
    console.error('[wishlists] POST error:', error)
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountNo = session.business_id
  if (!accountNo) return NextResponse.json({ error: 'No account on session' }, { status: 400 })

  const { sku } = await request.json()
  if (!sku) return NextResponse.json({ error: 'sku is required' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('account_no', accountNo)
    .eq('sku', sku)

  if (error) {
    console.error('[wishlists] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
