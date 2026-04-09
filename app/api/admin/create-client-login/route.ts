import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { sendNotificationEmail } from '@/lib/supabase/send-notification'

// Generate a random 8-character password
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(req: NextRequest) {
  try {
    const { email, account_no, password: providedPassword } = await req.json()

    if (!email || !account_no) {
      return NextResponse.json(
        { error: 'Email and account number are required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Generate temp password and hash it
    const tempPassword = providedPassword || generatePassword()
    const passwordHash = await bcrypt.hash(tempPassword, 10)
    const userId = randomUUID()

    // Insert into users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          password_hash: passwordHash,
          role: 'client',
          status: 'approved',
          business_id: account_no,
        },
      ])

    if (insertError) {
      console.error('[v0] Error inserting user:', insertError)
      
      // Send failure email notification
      await sendNotificationEmail({
        customerEmail: email,
        adminEmail: process.env.ADMIN_EMAIL,
        action: 'Create Client Login',
        status: 'failed',
        message: 'Failed to create client login. Please try again or contact support.',
        details: {
          'Email': email,
          'Account Number': account_no,
          'Error': insertError.message,
          'Timestamp': new Date().toISOString(),
        },
      })
      
      return NextResponse.json(
        { error: `Failed to create user record: ${insertError.message}` },
        { status: 400 }
      )
    }

    const { error: contactError } = await supabase
      .from('contacts')
      .upsert(
        {
          client_account_no: account_no,
          email: email,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'client_account_no',
        }
      )

    if (contactError) {
      console.error('[v0] Error upserting contact:', contactError)
      await sendNotificationEmail({
        customerEmail: email,
        adminEmail: process.env.ADMIN_EMAIL,
        action: 'Create Client Login',
        status: 'failed',
        message: 'Login was created, but the linked contact record could not be updated.',
        details: {
          'Email': email,
          'Account Number': account_no,
          'Error': contactError.message,
          'Timestamp': new Date().toISOString(),
        },
      })
      return NextResponse.json(
        { error: `Failed to update contact record: ${contactError.message}` },
        { status: 400 }
      )
    }

    // Send success email notification
    await sendNotificationEmail({
      customerEmail: email,
      adminEmail: process.env.ADMIN_EMAIL,
      action: 'Create Client Login',
      status: 'success',
      message: `Your client login has been successfully created. Your temporary password is included below.`,
      details: {
        'Email': email,
        'Account Number': account_no,
        'User ID': userId,
        'Temporary Password': tempPassword,
        'Timestamp': new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Login created successfully',
      userId: userId,
      email: email,
      password: tempPassword,
    })
  } catch (err: any) {
    console.error('[v0] Error in create-client-login:', err)
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
