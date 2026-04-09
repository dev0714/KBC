import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie
    const cookieStore = await cookies()
    cookieStore.delete('kbc_session')

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Logout API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
