/**
 * Stage 2/3 pricing: per-carrier price calculation, replicating the source
 * workbooks exactly. Behavioural quirks are kept (and flagged) rather than
 * corrected — they are configurable per rate card so they can be changed as
 * data later without touching this code.
 */
import type { CarrierQuote, DsvRateCard, MjvAreaRate, RateCell } from './types'

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * MJV (Courier_Comparison_v2 Sheet1!C33..C37):
 *   total = (base + TA) x (1 + fuel)
 * where base is the per-kg rate added ONCE in 'flat_once' mode (the sheet's
 * exact behaviour) or rate x weight in 'per_kg' mode, and
 * TA = max(weight - threshold, 0) x taPerKg.
 * Worked example: Main, 757kg -> (55 + 747x2) x 1.46 = 2261.54.
 */
export function priceMJV(rate: MjvAreaRate, weightKg: number): CarrierQuote {
  const base = rate.baseMode === 'per_kg' ? rate.ratePerKg * weightKg : rate.ratePerKg
  const ta = Math.max(weightKg - rate.taThresholdKg, 0) * rate.taPerKg
  const total = round2((base + ta) * (1 + rate.fuelLevy))
  return {
    carrier: 'MJV',
    total,
    breakdown: {
      area: rate.area,
      baseMode: rate.baseMode,
      base: round2(base),
      taSurcharge: round2(ta),
      fuelLevy: rate.fuelLevy,
    },
  }
}

/**
 * Band selection mirrors the sheet's approximate VLOOKUP on the sorted band
 * floors: greatest band whose floor <= weight; weights below the first floor
 * fall into the first band.
 */
export function findBand(cells: RateCell[], element: number, weightKg: number): RateCell | null {
  const rows = cells.filter((c) => c.element === element).sort((a, b) => a.bandMinKg - b.bandMinKg)
  if (!rows.length) return null
  let hit = rows[0]
  for (const c of rows) if (c.bandMinKg <= weightKg) hit = c
  return hit
}

/**
 * DSV (Courier_Comparison_v2 Sheet1!E34..E37):
 *   total = (cell + minimum) x (1 + fuel)
 * Note the minimum is ADDED to the band price, not applied as a floor — that
 * is exactly what E37 = (E35 + E34) x E36 does in the sheet. The top band is
 * per-kilo, so its cell value is multiplied by weight first.
 */
export function priceDSV(card: DsvRateCard, element: number, weightKg: number): CarrierQuote | null {
  const cell = findBand(card.cells, element, weightKg)
  if (!cell) return null
  const bandPrice = cell.perUnit === 'kg' ? cell.price * weightKg : cell.price
  const total = round2((bandPrice + card.minimum) * (1 + card.fuelLevy))
  return {
    carrier: 'DSV',
    total,
    breakdown: {
      service: card.service,
      element,
      band: cell.bandLabel,
      perUnit: cell.perUnit,
      bandPrice: round2(bandPrice),
      minimum: card.minimum,
      fuelLevy: card.fuelLevy,
    },
  }
}
