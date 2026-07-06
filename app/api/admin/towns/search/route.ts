import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { searchTowns } from '@/lib/courier/quote'

// GET ?q=<partial> -> town/suburb name suggestions the quote resolver can match.

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const q = request.nextUrl.searchParams.get('q') ?? ''
  return NextResponse.json({ towns: searchTowns(q) })
}
