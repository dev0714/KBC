import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!process.env.JWT_SECRET) {
      console.error('[v0] JWT_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create Supabase client with anon key for login queries
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    // Query users table for matching email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, role, business_id, status')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      console.error('[v0] User query error:', userError)
      throw userError
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!user.password_hash) {
      console.error('[v0] User has no password_hash set')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      business_id: user.business_id,
      status: user.status,
    }
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        role: user.role,
        status: user.status,
      },
      { status: 200 }
    )

    // Set httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('kbc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('[v0] Login API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
