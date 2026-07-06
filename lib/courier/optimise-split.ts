/**
 * DSV parcel-split optimisation. DSV prices each parcel independently against
 * the band grid, so one heavy shipment can be cheaper as several parcels —
 * the comparison workbook let staff test up to 4 splits by hand (Table6);
 * this searches the sensible candidates automatically.
 */
import { priceDSV } from './pricing'
import type { CarrierQuote, DsvRateCard } from './types'

const round2 = (n: number) => Math.round(n * 100) / 100

function priceParcels(card: DsvRateCard, element: number, parcels: number[]): number | null {
  let total = 0
  for (const w of parcels) {
    const q = priceDSV(card, element, w)
    if (!q) return null
    total += q.total
  }
  return round2(total)
}

/**
 * Tries the unsplit shipment, equal splits into 2..maxParcels, and splits
 * along each band boundary (one parcel filled to just under the boundary,
 * remainder in the rest). Returns the cheapest.
 */
export function optimiseSplit(
  card: DsvRateCard,
  element: number,
  weightKg: number,
  maxParcels = 4,
): CarrierQuote | null {
  const boundaries = [...new Set(card.cells.filter((c) => c.element === element && c.bandMaxKg !== null).map((c) => c.bandMaxKg!))].sort((a, b) => a - b)

  const candidates: number[][] = [[weightKg]]
  for (let n = 2; n <= maxParcels; n++) {
    const w = round2(weightKg / n)
    const rest = round2(weightKg - w * (n - 1))
    if (w > 0 && rest > 0) candidates.push([...Array(n - 1).fill(w), rest])
  }
  for (const b of boundaries) {
    const cap = round2(b - 0.01)
    if (cap <= 0 || cap >= weightKg) continue
    for (let n = 2; n <= maxParcels; n++) {
      const rest = round2(weightKg - cap * (n - 1))
      if (rest > 0 && cap * (n - 1) < weightKg) candidates.push([...Array(n - 1).fill(cap), rest])
    }
  }

  let best: { parcels: number[]; total: number } | null = null
  for (const parcels of candidates) {
    const total = priceParcels(card, element, parcels)
    if (total !== null && (!best || total < best.total)) best = { parcels, total }
  }
  if (!best) return null

  const single = priceDSV(card, element, weightKg)
  return {
    carrier: 'DSV',
    total: best.total,
    breakdown: {
      service: card.service,
      element,
      parcels: best.parcels.length,
      unsplitTotal: single ? single.total : 'n/a',
      saving: single ? round2(single.total - best.total) : 0,
      fuelLevy: card.fuelLevy,
    },
    parcels: best.parcels,
  }
}
