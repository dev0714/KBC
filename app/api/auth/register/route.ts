import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, companyName, phoneNumber, address, businessType } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[v0] Error checking existing user:', checkError)
      throw checkError
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Generate account_no
    const accountNo = `KBC-${Date.now().toString().slice(-6)}`

    // Hash password and generate UUID
    const passwordHash = await bcrypt.hash(password, 10)
    const userId = randomUUID()

    // Insert into clients table first
    const { error: insertClientError } = await supabase
      .from('clients')
      .insert([
        {
          account_no: accountNo,
          client_name: companyName || '',
          address: address || '',
        },
      ])

    if (insertClientError) {
      console.error('[v0] Error creating client record:', insertClientError)
      return NextResponse.json(
        { error: 'Failed to create client profile' },
        { status: 500 }
      )
    }

    // Insert new user
    const { error: insertUserError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          password_hash: passwordHash,
          full_name: fullName || '',
          phone_number: phoneNumber || '',
          business_type: businessType || '',
          role: 'client',
          status: 'pending',
          business_id: accountNo,
        },
      ])

    if (insertUserError) {
      console.error('[v0] Error creating user:', insertUserError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Register API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
