import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log('[v0] Session - all cookies:', allCookies.map(c => c.name))
    const token = cookieStore.get('kbc_session')?.value
    console.log('[v0] Session - kbc_session exists:', !!token)

    if (!token) {
      return NextResponse.json(
        { error: 'No session' },
        { status: 401 }
      )
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('[v0] JWT_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json(payload, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Session verification error:', error.message)
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }
}
