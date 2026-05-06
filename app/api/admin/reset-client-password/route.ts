import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { account_no, newPassword } = await request.json()

    if (!account_no || !newPassword) {
      return NextResponse.json(
        { error: 'Account number and new password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find user by business_id (account_no)
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, email')
      .eq('business_id', account_no)
      .maybeSingle()

    if (findError || !users) {
      console.error('[v0] Error finding user:', findError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', users.id)

    if (updateError) {
      console.error('[v0] Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    console.log('[v0] Password reset successful for:', { account_no, email: users.email })

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully',
      email: users.email 
    }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Reset password API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
