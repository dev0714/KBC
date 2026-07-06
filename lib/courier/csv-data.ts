/**
 * CSV-backed CourierData provider. Loads the extracted reference data from
 * data/courier/ into the in-memory indexes the engine consumes. Used by the
 * golden tests and as a fallback until the Supabase provider lands.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { norm, type CourierData, type DsvRateCard, type MjvAreaRate, type RateCell, type Service } from './types'

/** Minimal RFC-4180 CSV parser (quoted fields may contain commas/newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else field += ch
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

function readCsv(dir: string, name: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(readFileSync(join(dir, name), 'utf8'))
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

/** First occurrence wins, matching Excel VLOOKUP semantics. */
function firstWins<V>(entries: Iterable<[string, V]>): Map<string, V> {
  const m = new Map<string, V>()
  for (const [k, v] of entries) if (!m.has(k)) m.set(k, v)
  return m
}

export function loadCourierData(dir = join(process.cwd(), 'data', 'courier')): CourierData {
  const towns = readCsv(dir, 'mb_townlist.csv').map((r) => ({
    townCode: r.town_code,
    tariffHub: r.tariff_hub,
    opsBranch: r.ops_branch,
    townName: r.town_name,
    slaFacility: r.sla_facility,
    zone: r.zone === '' ? null : Number(r.zone),
  }))

  const fixtures = JSON.parse(readFileSync(join(dir, 'golden_fixtures.json'), 'utf8'))
  // Control!B2 was "4/31/2026" in the sheet (an invalid date); treat as 30 Apr.
  const expiryRaw: string = fixtures.controlExpiry ?? ''
  const expiryMatch = expiryRaw.match(/(\d+)\/(\d+)\/(\d+)/)
  const rateCardExpiry = expiryMatch
    ? new Date(Number(expiryMatch[3]), Number(expiryMatch[1]) - 1, Math.min(Number(expiryMatch[2]), 30))
    : null

  const sla = readCsv(dir, 'sla_lookups.csv')

  return {
    townByName: firstWins(towns.map((t) => [norm(t.townName), t] as [string, typeof t])),
    townByCode: firstWins(towns.map((t) => [norm(t.townCode), t] as [string, typeof t])),
    suburbToTownCode: firstWins(
      readCsv(dir, 'mb_suburblist.csv').map((r) => [norm(r.suburb), r.town_code] as [string, string]),
    ),
    financialByLookup: firstWins(
      readCsv(dir, 'bpp_financial_townlist.csv')
        .filter((r) => r.lookup)
        .map((r) => [norm(r.lookup), { lookup: r.lookup, branch: r.branch, zone: r.zone }] as const),
    ),
    linehaulLegsByDesc: firstWins(
      readCsv(dir, 'lh_terminal.csv').map((r) => [norm(r.lh_product_desc), Number(r.total_legs)] as [string, number]),
    ),
    linehaulOverrideByKey: firstWins(
      readCsv(dir, 'lh_direct_overrides.csv').map((r) => [norm(r.lookup_key), Number(r.element)] as [string, number]),
    ),
    slaTypeByPair: firstWins(
      sla.filter((r) => r.orig_type && r.orig_type !== 'OrigType')
        .map((r) => [norm(r.orig_type + r.dest_type), r.sla_type] as [string, string]),
    ),
    routeBandByRoute: firstWins(
      sla.filter((r) => r.route && r.route !== 'Route' && r.tariff !== '')
        .map((r) => [norm(r.route), Number(r.tariff)] as [string, number]),
    ),
    slaTextByLookup: firstWins(
      sla.filter((r) => r.lookup && r.lookup !== 'Lookup' && r.sla_text)
        .map((r) => [norm(r.lookup), r.sla_text] as [string, string]),
    ),
    blnsSlaByLookup: firstWins(
      sla.filter((r) => r.blns_lookup && r.blns_lookup !== 'Lookup' && r.blns_sla)
        .map((r) => [norm(r.blns_lookup), r.blns_sla] as [string, string]),
    ),
    rateCardExpiry,
  }
}

export function loadDsvRateCards(dir = join(process.cwd(), 'data', 'courier')): Record<Service, DsvRateCard> {
  const meta = JSON.parse(readFileSync(join(dir, 'dsv_rate_card_meta.json'), 'utf8'))
  const load = (service: Service): DsvRateCard => {
    const cells: RateCell[] = readCsv(dir, `dsv_rate_card_${service.toLowerCase()}.csv`).map((r) => {
      const over = r.weight_band.match(/(?:Over|>)\s*(\d+)/i)
      const range = r.weight_band.match(/([\d.]+)\s*to\s*<\s*([\d.]+)/i)
      return {
        element: Number(r.element),
        bandMinKg: over ? Number(over[1]) : Number(range![1]),
        bandMaxKg: over ? null : Number(range![2]),
        bandLabel: r.weight_band,
        perUnit: over ? 'kg' : 'shipment',
        price: Number(r.price),
      }
    })
    return {
      service,
      minimum: Number(meta[service].minimum),
      fuelLevy: 0.306, // per the comparison workbook's DSV levy
      cells,
    }
  }
  return { Economy: load('Economy'), Express: load('Express') }
}

export function loadMjvAreaRates(dir = join(process.cwd(), 'data', 'courier')): MjvAreaRate[] {
  return readCsv(dir, 'mjv_area_rates.csv').map((r) => ({
    area: r.area,
    ratePerKg: Number(r.rate_per_kg),
    taPerKg: Number(r.ta_per_kg),
    taThresholdKg: 10,
    fuelLevy: Number(r.fuel_levy),
    baseMode: 'flat_once' as const,
  }))
}

export function loadCityClassifications(dir = join(process.cwd(), 'data', 'courier')): Map<string, string> {
  const m = new Map<string, string>()
  for (const r of readCsv(dir, 'city_classifications.csv')) {
    const k = norm(r.city)
    if (!m.has(k)) m.set(k, norm(r.classification))
  }
  return m
}
