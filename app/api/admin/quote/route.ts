import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { quote, type QuoteRequest } from '@/lib/courier/quote'

// POST -> { route, quotes, comparison, warnings } for an origin/destination/
//         service/weight. Internal staff tool; shows raw carrier numbers.

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Partial<QuoteRequest>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const weightKg = Number(body.weightKg)
  if (!body.origin?.trim() || !body.destination?.trim()) {
    return NextResponse.json({ error: 'origin and destination are required' }, { status: 400 })
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return NextResponse.json({ error: 'weightKg must be a positive number' }, { status: 400 })
  }
  if (body.service !== 'Economy' && body.service !== 'Express') {
    return NextResponse.json({ error: 'service must be Economy or Express' }, { status: 400 })
  }

  try {
    const result = quote({
      origin: body.origin.trim(),
      originPostcode: body.originPostcode?.trim(),
      destination: body.destination.trim(),
      destPostcode: body.destPostcode?.trim(),
      service: body.service,
      weightKg,
      allowSplit: body.allowSplit !== false,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[quote] POST error:', err)
    return NextResponse.json({ error: 'Failed to compute quote' }, { status: 500 })
  }
}
