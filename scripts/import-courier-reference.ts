/**
 * Loads the extracted courier reference data (data/courier/*.csv) into Supabase.
 *
 * Idempotent: each table is fully replaced on every run, so re-running after a
 * fresh extraction is safe. Requires the service-role key:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-courier-reference.ts
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DATA_DIR = join(process.cwd(), 'data', 'courier')
const BATCH = 2000

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

/** Minimal RFC-4180 CSV parser (handles quoted fields with commas/newlines). */
function parseCsv(text: string): string[][] {
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

function readCsv(name: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(readFileSync(join(DATA_DIR, name), 'utf8'))
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

const num = (v: string) => (v === '' || Number.isNaN(Number(v)) ? null : Number(v))
const dateOnly = (v: string) => (v ? v.slice(0, 10) : null)

async function replaceTable(table: string, rows: object[]) {
  const del = await db.from(table).delete().gte('id', 0)
  if (del.error) throw new Error(`${table} delete: ${del.error.message}`)
  for (let i = 0; i < rows.length; i += BATCH) {
    const ins = await db.from(table).insert(rows.slice(i, i + BATCH))
    if (ins.error) throw new Error(`${table} insert @${i}: ${ins.error.message}`)
  }
  console.log(`${table}: ${rows.length} rows`)
}

/** "1 to < 5" -> [1, 5]; "Over 350" / "> 350" -> [350, null]. */
function parseBand(label: string): { min: number; max: number | null; perUnit: 'shipment' | 'kg' } {
  const over = label.match(/(?:Over|>)\s*(\d+)/i)
  if (over) return { min: Number(over[1]), max: null, perUnit: 'kg' }
  const m = label.match(/([\d.]+)\s*to\s*<\s*([\d.]+)/i)
  if (!m) throw new Error(`unparseable weight band: "${label}"`)
  return { min: Number(m[1]), max: Number(m[2]), perUnit: 'shipment' }
}

async function main() {
  await replaceTable(
    'courier_towns',
    readCsv('mb_townlist.csv').map((r) => ({
      town_code: r.town_code, tariff_hub: r.tariff_hub, ops_branch: r.ops_branch,
      town_name: r.town_name, province: r.province || null, town_type: r.town_type || null,
      sla_facility: r.sla_facility || null, zone: num(r.zone),
    })),
  )

  await replaceTable(
    'courier_suburbs',
    readCsv('mb_suburblist.csv').map((r) => ({ suburb: r.suburb, town_code: r.town_code })),
  )

  await replaceTable(
    'courier_financial_towns',
    readCsv('bpp_financial_townlist.csv').map((r) => ({
      city: r.city, from_postcode: r.from_postcode || null, thru_postcode: r.thru_postcode || null,
      branch: r.branch || null, zone: num(r.zone), service_level: r.service_level || null,
      from_date: dateOnly(r.from_date), till_date: dateOnly(r.till_date),
    })),
  )

  await replaceTable(
    'courier_billing_towns',
    readCsv('townslist.csv').map((r) => ({
      town_name: r.town_name, billing_town: r.billing_town || null,
      zone: num(r.zone), ops_branch: r.ops_branch || null,
    })),
  )

  await replaceTable(
    'courier_linehaul',
    readCsv('lh_terminal.csv').map((r) => ({
      orig_branch: r.orig_branch, dest_branch: r.dest_branch,
      product_desc: r.lh_product_desc, total_legs: num(r.total_legs),
    })),
  )

  await replaceTable(
    'courier_linehaul_overrides',
    readCsv('lh_direct_overrides.csv').map((r) => ({
      lookup_key: r.lookup_key, element: num(r.element),
    })),
  )

  const sla = readCsv('sla_lookups.csv')
  await replaceTable(
    'courier_sla_type_map',
    sla.filter((r) => r.orig_type && r.orig_type !== 'OrigType')
      .map((r) => ({ orig_type: r.orig_type, dest_type: r.dest_type, sla_type: r.sla_type, sla_type_code: r.sla_type_code || null })),
  )
  await replaceTable(
    'courier_sla_route_bands',
    sla.filter((r) => r.route && r.route !== 'Route' && num(r.tariff) !== null)
      .map((r) => ({ route: r.route, band: num(r.tariff) })),
  )
  await replaceTable(
    'courier_sla_matrix',
    sla.filter((r) => r.lookup && r.lookup !== 'Lookup' && r.sla_text)
      .map((r) => ({
        service: r.service, facility_type: r.facility_type, route_band: num(r.route_band),
        sla_days: num(r.sla_days), sla_text: r.sla_text, lookup: r.lookup,
      })),
  )
  await replaceTable(
    'courier_sla_blns',
    sla.filter((r) => r.blns_lookup && r.blns_lookup !== 'Lookup' && r.blns_sla)
      .map((r) => ({ lookup: r.blns_lookup, sla_text: r.blns_sla })),
  )

  await replaceTable(
    'courier_branch_map',
    readCsv('branch_map.csv').filter((r) => r.ops_branch !== 'Branch')
      .map((r) => ({ ops_branch: r.ops_branch, tariff_branch: r.tariff_branch })),
  )

  await replaceTable(
    'courier_city_classes',
    readCsv('city_classifications.csv').map((r) => ({ city: r.city, classification: r.classification })),
  )

  // ---------------------------------------------------------------- carriers & rate cards
  const meta = JSON.parse(readFileSync(join(DATA_DIR, 'dsv_rate_card_meta.json'), 'utf8'))

  await db.from('courier_quotes').delete().gte('id', 0)
  await db.from('couriers').delete().gte('id', 0) // cascades to cards/cells/areas
  const carriers = await db
    .from('couriers')
    .insert([
      { name: 'MJV', rate_model: 'area_perkg' },
      { name: 'DSV', rate_model: 'zone_element_band' },
    ])
    .select()
  if (carriers.error) throw new Error(carriers.error.message)
  const mjvId = carriers.data.find((c) => c.name === 'MJV')!.id
  const dsvId = carriers.data.find((c) => c.name === 'DSV')!.id

  // MJV: one card, per-area rates. base_mode 'flat_once' replicates the sheet
  // exactly (base rate added once, not x weight); editable in admin later.
  const mjvAreas = readCsv('mjv_area_rates.csv')
  const mjvCard = await db
    .from('courier_rate_cards')
    .insert({
      courier_id: mjvId, service: null, account_ref: 'WEST POINT TRADING 55 CC',
      fuel_levy: Number(mjvAreas[0].fuel_levy), effective_from: '2026-02-05',
    })
    .select()
    .single()
  if (mjvCard.error) throw new Error(mjvCard.error.message)
  await replaceTable(
    'courier_area_rates',
    mjvAreas.map((r) => ({
      rate_card_id: mjvCard.data.id, area: r.area,
      rate_per_kg: Number(r.rate_per_kg), ta_per_kg: Number(r.ta_per_kg),
      ta_threshold_kg: 10, base_mode: 'flat_once',
    })),
  )

  // DSV: one card per service grid. Fuel levy 0.306 per the comparison sheet;
  // effective_to mirrors the estimator's Control!B2 guard ("4/31/2026" -> 30 Apr).
  for (const service of ['Economy', 'Express'] as const) {
    const m = meta[service]
    const card = await db
      .from('courier_rate_cards')
      .insert({
        courier_id: dsvId, service, account_ref: m.account,
        fuel_levy: 0.306, minimum_charge: Number(m.minimum),
        effective_from: dateOnly(m.effective_date), effective_to: '2026-04-30',
      })
      .select()
      .single()
    if (card.error) throw new Error(card.error.message)
    const cells = readCsv(`dsv_rate_card_${service.toLowerCase()}.csv`).map((r) => {
      const band = parseBand(r.weight_band)
      return {
        rate_card_id: card.data.id, element: Number(r.element),
        band_min_kg: band.min, band_max_kg: band.max, band_label: r.weight_band,
        per_unit: band.perUnit, price: Number(r.price),
      }
    })
    for (let i = 0; i < cells.length; i += BATCH) {
      const ins = await db.from('courier_rate_cells').insert(cells.slice(i, i + BATCH))
      if (ins.error) throw new Error(`rate_cells: ${ins.error.message}`)
    }
    console.log(`courier_rate_cells (${service}): ${cells.length} rows`)
  }

  console.log('Import complete.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
