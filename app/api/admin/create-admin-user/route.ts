import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, full_name, password } = await request.json()

    // Validate inputs
    if (!email || !full_name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name, password' },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Create admin user
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        full_name,
        password_hash,
        role: 'admin',
        status: 'approved'
      })
      .select()

    if (error) {
      console.error('[v0] Supabase error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create admin user' },
        { status: 400 }
      )
    }

    console.log('[v0] Admin user created successfully:', email)
    return NextResponse.json({ success: true, user: data?.[0] })
  } catch (err: any) {
    console.error('[v0] Error creating admin user:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
