/**
 * Quote orchestrator: ties route resolution, carrier pricing, split
 * optimisation and the recommendation together for the API layer.
 *
 * Reference data currently comes from the committed CSVs (data/courier/),
 * cached per server process. Swapping in a Supabase-backed provider later
 * only changes getQuoteContext().
 */
import {
  loadCityClassifications,
  loadCourierData,
  loadDsvRateCards,
  loadMjvAreaRates,
} from './csv-data'
import { compare } from './compare'
import { optimiseSplit } from './optimise-split'
import { priceDSV, priceMJV } from './pricing'
import { resolveRoute } from './resolve-route'
import { norm, type CarrierQuote, type Comparison, type RouteResult, type Service } from './types'

export interface QuoteRequest {
  origin: string
  originPostcode?: string
  destination: string
  destPostcode?: string
  service: Service
  weightKg: number
  allowSplit?: boolean
}

export interface QuoteResponse {
  route: RouteResult
  quotes: CarrierQuote[]
  comparison: Comparison | null
  warnings: string[]
}

function buildContext() {
  return {
    data: loadCourierData(),
    dsvCards: loadDsvRateCards(),
    mjvRates: loadMjvAreaRates(),
    cityClasses: loadCityClassifications(),
  }
}

let context: ReturnType<typeof buildContext> | null = null
export function getQuoteContext() {
  context ??= buildContext()
  return context
}

export function quote(req: QuoteRequest): QuoteResponse {
  const ctx = getQuoteContext()
  const warnings: string[] = []

  const route = resolveRoute(
    ctx.data,
    req.origin,
    req.originPostcode ?? '',
    req.destination,
    req.destPostcode ?? '',
    req.service,
    // Quote against the loaded card regardless of the legacy expiry guard;
    // surface the expiry as a warning instead of refusing like the sheet did.
    ctx.data.rateCardExpiry ?? new Date(0),
  )
  if (ctx.data.rateCardExpiry && new Date() > ctx.data.rateCardExpiry) {
    warnings.push(
      `The loaded DSV rate card expired on ${ctx.data.rateCardExpiry.toISOString().slice(0, 10)} — prices may be outdated.`,
    )
  }

  const quotes: CarrierQuote[] = []

  // MJV: destination classified Main/Local/Outlying via the city list.
  const cityClass = ctx.cityClasses.get(norm(req.destination))
  const area = ctx.mjvRates.find((a) => norm(a.area) === cityClass)
  if (area) {
    quotes.push(priceMJV(area, req.weightKg))
  } else {
    warnings.push(
      cityClass
        ? `MJV: destination "${req.destination}" is classified "${cityClass}", which has no MJV rate.`
        : `MJV: destination "${req.destination}" is not in the area classification list — no MJV price.`,
    )
  }

  // DSV: needs a resolved element.
  if (route.ok && route.element !== undefined) {
    const card = ctx.dsvCards[req.service]
    const dsv =
      req.allowSplit === false
        ? priceDSV(card, route.element, req.weightKg)
        : optimiseSplit(card, route.element, req.weightKg)
    if (dsv) quotes.push(dsv)
    else warnings.push(`DSV: no rate found for element ${route.element}.`)
  } else if (route.error) {
    warnings.push(`DSV: route not resolved — ${route.error}`)
  }

  return {
    route,
    quotes,
    comparison: quotes.length ? compare(quotes) : null,
    warnings,
  }
}

/** Town-name autocomplete over every name the resolver can actually match. */
export function searchTowns(query: string, limit = 12): { name: string; source: string }[] {
  const ctx = getQuoteContext()
  const q = norm(query)
  if (q.length < 2) return []

  const results: { name: string; source: string; rank: number }[] = []
  const seen = new Set<string>()
  const consider = (name: string, key: string, source: string) => {
    if (seen.has(key)) return
    const idx = key.indexOf(q)
    if (idx === -1) return
    seen.add(key)
    results.push({ name, source, rank: idx === 0 ? 0 : 1 })
  }

  for (const [key, town] of ctx.data.townByName) consider(town.townName, key, 'town')
  for (const [key] of ctx.data.suburbToTownCode) consider(key, key, 'suburb')

  return results
    .sort((a, b) => a.rank - b.rank || a.name.length - b.name.length)
    .slice(0, limit)
    .map(({ name, source }) => ({ name, source }))
}
