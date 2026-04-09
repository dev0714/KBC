import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Verify JWT token from cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('kbc_session')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify and decode JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '')
    let payload: any
    try {
      const verified = await jwtVerify(token, secret)
      payload = verified.payload
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = payload.id
    const email = payload.email

    if (!userId || !email) {
      return NextResponse.json({ error: 'User information not found in token' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    if (!user.password_hash) {
      return NextResponse.json({ error: 'User password not configured' }, { status: 400 })
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedNewPassword })
      .eq('id', userId)

    if (updateError) {
      console.error('[v0] Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error: any) {
    console.error('[v0] Change password error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
