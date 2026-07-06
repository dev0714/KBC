/**
 * Stage 3: put the carrier quotes side by side and recommend the cheapest,
 * mirroring Courier_Comparison_v2 Sheet1!C45.
 */
import type { CarrierQuote, Comparison } from './types'

const round2 = (n: number) => Math.round(n * 100) / 100

export function compare(quotes: CarrierQuote[]): Comparison {
  const valid = quotes.filter((q) => Number.isFinite(q.total))
  if (!valid.length) throw new Error('no valid carrier quotes to compare')
  const sorted = [...valid].sort((a, b) => a.total - b.total)
  return {
    quotes: valid,
    cheapest: sorted[0].carrier,
    difference: sorted.length > 1 ? round2(sorted[1].total - sorted[0].total) : 0,
  }
}
