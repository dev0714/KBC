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
    const result = await quote({
      origin: body.origin.trim(),
      originPostcode: body.originPostcode?.trim(),
      destination: body.destination.trim(),
      destPostcode: body.destPostcode?.trim(),
      service: body.service,
      weightKg,
      allowSplit: body.allowSplit !== false,
    })

    // Best-effort audit trail; quoting must not fail if the courier tables
    // haven't been migrated yet.
    try {
      const session = await requireAdmin()
      const { createServiceClient } = await import('@/lib/supabase/service')
      await createServiceClient().from('courier_quotes').insert({
        quoted_by: session?.email ?? null,
        origin: body.origin.trim(),
        origin_postcode: body.originPostcode?.trim() || null,
        destination: body.destination.trim(),
        dest_postcode: body.destPostcode?.trim() || null,
        service: body.service,
        weight_kg: weightKg,
        element: result.route.ok ? result.route.element : null,
        sla_text: result.route.sla ?? null,
        results: { quotes: result.quotes, comparison: result.comparison, warnings: result.warnings },
      })
    } catch {
      /* table not migrated yet or db unreachable */
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[quote] POST error:', err)
    return NextResponse.json({ error: 'Failed to compute quote' }, { status: 500 })
  }
}
