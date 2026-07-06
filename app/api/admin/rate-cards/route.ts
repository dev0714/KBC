import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'
import { invalidateQuoteContext } from '@/lib/courier/quote'

// GET   -> carriers with their rate cards (+ MJV area rates)
// PATCH -> update a card's fuel levy / dates / minimum, or an area rate row
//
// Requires the courier migration (20260706_0001) to be applied; returns 503
// with a clear message until then, since the quote engine falls back to the
// bundled CSV rates in that state.

const NOT_MIGRATED =
  'Courier tables not found — apply supabase/migrations/20260706_0001_courier_quoting_schema.sql and run scripts/import-courier-reference.ts'

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const cards = await db
    .from('courier_rate_cards')
    .select(
      'id, service, account_ref, fuel_levy, minimum_charge, effective_from, effective_to, couriers(id, name, rate_model)',
    )
    .order('effective_from', { ascending: false })
  if (cards.error) return NextResponse.json({ error: NOT_MIGRATED }, { status: 503 })

  const areas = await db
    .from('courier_area_rates')
    .select('id, rate_card_id, area, rate_per_kg, ta_per_kg, ta_threshold_kg, base_mode')
  const cellCounts = await db.from('courier_rate_cells').select('rate_card_id')
  const counts = new Map<number, number>()
  for (const row of cellCounts.data ?? []) {
    counts.set(row.rate_card_id, (counts.get(row.rate_card_id) ?? 0) + 1)
  }

  return NextResponse.json({
    cards: (cards.data ?? []).map((c) => ({
      ...c,
      cellCount: counts.get(c.id) ?? 0,
      areaRates: (areas.data ?? []).filter((a) => a.rate_card_id === c.id),
    })),
  })
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: {
    cardId?: number
    fuelLevy?: number
    minimumCharge?: number
    effectiveFrom?: string
    effectiveTo?: string | null
    areaRateId?: number
    ratePerKg?: number
    taPerKg?: number
    taThresholdKg?: number
    baseMode?: 'flat_once' | 'per_kg'
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const db = createServiceClient()

  if (body.areaRateId) {
    const patch: Record<string, unknown> = {}
    if (body.ratePerKg !== undefined) patch.rate_per_kg = body.ratePerKg
    if (body.taPerKg !== undefined) patch.ta_per_kg = body.taPerKg
    if (body.taThresholdKg !== undefined) patch.ta_threshold_kg = body.taThresholdKg
    if (body.baseMode !== undefined) {
      if (body.baseMode !== 'flat_once' && body.baseMode !== 'per_kg') {
        return NextResponse.json({ error: 'baseMode must be flat_once or per_kg' }, { status: 400 })
      }
      patch.base_mode = body.baseMode
    }
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    const res = await db.from('courier_area_rates').update(patch).eq('id', body.areaRateId)
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 })
    invalidateQuoteContext()
    return NextResponse.json({ ok: true })
  }

  if (body.cardId) {
    const patch: Record<string, unknown> = {}
    if (body.fuelLevy !== undefined) patch.fuel_levy = body.fuelLevy
    if (body.minimumCharge !== undefined) patch.minimum_charge = body.minimumCharge
    if (body.effectiveFrom !== undefined) patch.effective_from = body.effectiveFrom
    if (body.effectiveTo !== undefined) patch.effective_to = body.effectiveTo
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    const res = await db.from('courier_rate_cards').update(patch).eq('id', body.cardId)
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 })
    invalidateQuoteContext()
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'cardId or areaRateId is required' }, { status: 400 })
}
