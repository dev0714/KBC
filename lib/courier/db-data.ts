/**
 * Supabase-backed rate data. Reference data (towns, zones, SLA) stays on the
 * committed CSV extracts — it changes rarely and ships with the app — but
 * rate cards are editable in admin, so they are read from the database when
 * the courier tables exist and fall back to the CSVs when they don't (i.e.
 * before the courier migration has been applied).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DsvRateCard, MjvAreaRate, RateCell, Service } from './types'

interface RateCardRow {
  id: number
  service: string | null
  fuel_levy: number
  minimum_charge: number | null
  effective_from: string
  effective_to: string | null
  account_ref: string | null
  couriers: { name: string; rate_model: string } | null
}

/** Latest card per courier+service by effective_from. */
function latestCards(rows: RateCardRow[]): RateCardRow[] {
  const byKey = new Map<string, RateCardRow>()
  for (const r of rows) {
    const key = `${r.couriers?.name}:${r.service ?? ''}`
    const prev = byKey.get(key)
    if (!prev || r.effective_from > prev.effective_from) byKey.set(key, r)
  }
  return [...byKey.values()]
}

export interface DbRates {
  dsvCards: Partial<Record<Service, DsvRateCard>>
  mjvRates: MjvAreaRate[]
  expiry: Date | null
}

/**
 * Returns null when the courier tables are missing or empty, letting the
 * caller fall back to the CSV extracts.
 */
export async function loadRatesFromDb(db: SupabaseClient): Promise<DbRates | null> {
  const cardsRes = await db
    .from('courier_rate_cards')
    .select('id, service, fuel_levy, minimum_charge, effective_from, effective_to, account_ref, couriers(name, rate_model)')
  if (cardsRes.error || !cardsRes.data?.length) return null

  const cards = latestCards(cardsRes.data as unknown as RateCardRow[])
  const result: DbRates = { dsvCards: {}, mjvRates: [], expiry: null }

  for (const card of cards) {
    if (card.couriers?.rate_model === 'zone_element_band' && (card.service === 'Economy' || card.service === 'Express')) {
      const cellsRes = await db
        .from('courier_rate_cells')
        .select('element, band_min_kg, band_max_kg, band_label, per_unit, price')
        .eq('rate_card_id', card.id)
      if (cellsRes.error || !cellsRes.data?.length) continue
      const cells: RateCell[] = cellsRes.data.map((c) => ({
        element: c.element,
        bandMinKg: Number(c.band_min_kg),
        bandMaxKg: c.band_max_kg === null ? null : Number(c.band_max_kg),
        bandLabel: c.band_label,
        perUnit: c.per_unit as 'shipment' | 'kg',
        price: Number(c.price),
      }))
      result.dsvCards[card.service as Service] = {
        service: card.service as Service,
        minimum: Number(card.minimum_charge ?? 0),
        fuelLevy: Number(card.fuel_levy),
        cells,
      }
      if (card.effective_to) {
        const d = new Date(card.effective_to)
        if (!result.expiry || d < result.expiry) result.expiry = d
      }
    }

    if (card.couriers?.rate_model === 'area_perkg') {
      const areasRes = await db
        .from('courier_area_rates')
        .select('area, rate_per_kg, ta_per_kg, ta_threshold_kg, base_mode')
        .eq('rate_card_id', card.id)
      if (areasRes.error || !areasRes.data?.length) continue
      result.mjvRates = areasRes.data.map((a) => ({
        area: a.area,
        ratePerKg: Number(a.rate_per_kg),
        taPerKg: Number(a.ta_per_kg),
        taThresholdKg: Number(a.ta_threshold_kg),
        fuelLevy: Number(card.fuel_levy),
        baseMode: a.base_mode as 'flat_once' | 'per_kg',
      }))
    }
  }

  if (!result.mjvRates.length && !Object.keys(result.dsvCards).length) return null
  return result
}
