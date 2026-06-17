import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

// Fields an admin is permitted to update on a user row. Deliberately excludes
// id, password_hash, role, created_at, etc.
const ALLOWED_UPDATE_FIELDS = [
  'status',
  'full_name',
  'phone_number',
  'business_type',
  'email',
] as const

// GET   -> list users, optionally filtered to ?role=admin
// PATCH -> update a single user by id with a whitelisted set of fields
export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const role = request.nextUrl.searchParams.get('role')
  const supabase = createServiceClient()

  let query = supabase.from('users').select('id, email, full_name, role, status, business_id')
  if (role) query = query.eq('role', role)

  const { data, error } = await query
  if (error) {
    console.error('[admin/users] GET error:', error)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }

  return NextResponse.json({ users: data || [] })
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, updates } = await request.json()
  if (!id || !updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'id and updates are required' }, { status: 400 })
  }

  const sanitized: Record<string, unknown> = {}
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (field in updates) sanitized[field] = updates[field]
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('users').update(sanitized).eq('id', id)

  if (error) {
    console.error('[admin/users] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
