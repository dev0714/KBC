/**
 * Golden regression test for the courier quoting engine.
 *
 * Replays every worked example captured from the BPP Element Estimator's INPUT
 * sheet (data/courier/golden_fixtures.json) through resolveRoute() and fails
 * unless Element and SLA match the spreadsheet exactly. Also verifies the MJV
 * worked example from Courier_Comparison_v2 (JHB->DBN, 757kg, Main = R2261.54).
 *
 * Run: npx tsx scripts/courier-golden.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadCourierData, loadDsvRateCards, loadMjvAreaRates } from '../lib/courier/csv-data'
import { resolveRoute } from '../lib/courier/resolve-route'
import { findBand, priceDSV, priceMJV } from '../lib/courier/pricing'
import { optimiseSplit } from '../lib/courier/optimise-split'
import { compare } from '../lib/courier/compare'

const DATA = join(process.cwd(), 'data', 'courier')
const fixtures = JSON.parse(readFileSync(join(DATA, 'golden_fixtures.json'), 'utf8'))
const data = loadCourierData(DATA)

// The sheet's expiry guard (Control!B2 = end of April 2026) has already lapsed;
// pin "today" before it so the fixtures replay the way the sheet computed them.
const ASOF = new Date(2026, 2, 1)

let pass = 0
const failures: string[] = []

for (const c of fixtures.cases) {
  const label = `${c.origin}(${c.originPostcode || '-'}) -> ${c.destination}(${c.destPostcode || '-'}) ${c.service.trim()}`
  const r = resolveRoute(data, c.origin, c.originPostcode, c.destination, c.destPostcode, c.service, ASOF)
  const expectedElement = c.expected.element
  const expectedSla = c.expected.sla

  const gotElement = r.ok ? String(r.element) : (r.error ?? '')
  const elementOk = gotElement === expectedElement
  // "#N/A" in the sheet means "no SLA computed", which the engine reports as undefined.
  const wantSla = expectedSla === '#N/A' ? '' : expectedSla
  const slaOk = !expectedSla || (r.sla ?? '') === wantSla

  if (elementOk && slaOk) {
    pass++
  } else {
    failures.push(
      `${label}\n  element: expected "${expectedElement}" got "${gotElement}"` +
        (slaOk ? '' : `\n  sla: expected "${expectedSla}" got "${r.sla ?? ''}"`) +
        `\n  debug: ${JSON.stringify(r.debug)}`,
    )
  }
}

console.log(`route fixtures: ${pass}/${fixtures.cases.length} pass`)
if (failures.length) {
  console.log(`\nFAILURES (${failures.length}):`)
  for (const f of failures.slice(0, 12)) console.log('-', f)
  if (failures.length > 12) console.log(`... and ${failures.length - 12} more`)
}

// MJV worked example from Courier_Comparison_v2 Sheet1.
const mjv = loadMjvAreaRates(DATA)
const main = mjv.find((a) => a.area === 'Main')!
const quote = priceMJV(main, 757)
assert.equal(quote.total.toFixed(2), '2261.54', `MJV worked example: got ${quote.total}`)
console.log('MJV worked example (757kg Main = R2261.54): pass')

// DSV pricing smoke checks against raw rate-card cells (the workbook's own
// DSV total is a broken #REF!, so these assert band selection and the sheet's
// (cell + minimum) x fuel arithmetic rather than a captured total).
const cards = loadDsvRateCards(DATA)
const eco = cards.Economy

// Element 2, 757kg -> "> 350" per-kilo band (R2.31/kg on the source card).
const top = findBand(eco.cells, 2, 757)!
assert.equal(top.bandLabel, '> 350')
assert.equal(top.perUnit, 'kg')
assert.equal(top.price, 2.31)

// Element 11, 22kg -> "20 to < 25" = R146.86 -> (146.86 + 37.11) x 1.306.
const q11 = priceDSV(eco, 11, 22)!
assert.equal((q11.breakdown as Record<string, unknown>).band, '20 to < 25')
assert.equal(q11.total, Math.round((146.86 + 37.11) * 1.306 * 100) / 100)

// Weight below the first band floor still prices (clamps to the first band).
assert.ok(priceDSV(eco, 1, 0.5) !== null)

// Split optimiser never returns worse than the unsplit price.
const single = priceDSV(eco, 11, 120)!
const split = optimiseSplit(eco, 11, 120)!
assert.ok(split.total <= single.total, `split ${split.total} > single ${single.total}`)

// Comparison picks the cheaper carrier and reports the difference.
const cmp = compare([quote, { carrier: 'DSV', total: quote.total + 100, breakdown: {} }])
assert.equal(cmp.cheapest, 'MJV')
assert.equal(cmp.difference, 100)
console.log('DSV pricing / split / comparison smoke checks: pass')

if (failures.length) process.exit(1)
console.log('ALL GOLDEN TESTS PASS')
