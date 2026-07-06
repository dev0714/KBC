/**
 * "Did you mean" suggestions for towns the resolver can't match exactly —
 * the spreadsheet just failed with "Check Origin Town" on any typo.
 */
import { norm, type CourierData } from './types'

/** Levenshtein distance with an early-exit cap. */
function distance(a: string, b: string, cap: number): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (cur[j] < rowMin) rowMin = cur[j]
    }
    if (rowMin > cap) return cap + 1
    prev = cur
  }
  return prev[b.length]
}

export function suggestTowns(data: CourierData, input: string, limit = 3): string[] {
  const q = norm(input)
  if (q.length < 3) return []
  const cap = q.length <= 5 ? 1 : 2

  const scored: { name: string; d: number }[] = []
  for (const [key, town] of data.townByName) {
    const d = distance(q, key, cap)
    if (d <= cap) scored.push({ name: town.townName, d })
  }
  if (!scored.length) {
    for (const [key] of data.suburbToTownCode) {
      const d = distance(q, key, cap)
      if (d <= cap) scored.push({ name: key, d })
    }
  }
  return scored
    .sort((a, b) => a.d - b.d || a.name.length - b.name.length)
    .slice(0, limit)
    .map((s) => s.name)
}
