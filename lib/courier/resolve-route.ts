/**
 * Stage 1 of the quoting engine: resolve origin/destination towns to a DSV
 * Element (1-30) and an SLA string, porting the BPP Element Estimator's INPUT
 * sheet formula chain exactly. See the design spec (docs/superpowers/specs/
 * 2026-07-06-courier-quoting-design.md) for the original formulas; comments
 * below reference the sheet columns they replicate.
 */
import { norm, type CourierData, type FinancialTown, type RouteResult, type TownRecord } from './types'

const BLNS_HUBS = new Set(['GBE', 'MBE', 'MSU', 'MTS', 'WDH'])

/** INPUT!R4/S4: town name -> town code via MB_TownList, MB_Suburblist fallback. */
function resolveTownCode(data: CourierData, town: string): string | null {
  const key = norm(town)
  return data.townByName.get(key)?.townCode ?? data.suburbToTownCode.get(key) ?? null
}

/**
 * INPUT!M4/N4/O4/P4: BPP_FinancialTownlist lookup with the sheet's exact
 * fallback chain — city+postcode (leading zeros stripped, dropped when 0),
 * then city alone, then bare postcode.
 */
function financialLookup(data: CourierData, town: string, postcode: string): FinancialTown | null {
  const pc = Number((postcode ?? '').trim())
  const pcPart = Number.isFinite(pc) && pc !== 0 ? String(pc) : ''
  return (
    (pcPart ? data.financialByLookup.get(norm(town) + pcPart) : undefined) ??
    data.financialByLookup.get(norm(town)) ??
    (pcPart ? data.financialByLookup.get(pcPart) : undefined) ??
    null
  )
}

export function resolveRoute(
  data: CourierData,
  origin: string,
  originPostcode: string,
  destination: string,
  destPostcode: string,
  service: string,
  today: Date = new Date(),
): RouteResult {
  const debug: RouteResult['debug'] = {}
  const svc = (service ?? '').trim()

  // INPUT!G4 guard: refuse to quote past the rate-card expiry (Control!B2).
  if (data.rateCardExpiry && today > data.rateCardExpiry) {
    return { ok: false, error: 'Rate card has expired — load a current rate card', debug }
  }

  // Town codes and hub metadata (R4, S4, X4, Y4) — independent of the
  // financial-list zones, exactly as in the sheet.
  const origCode = resolveTownCode(data, origin)
  const destCode = resolveTownCode(data, destination)
  debug.origTownCode = origCode ?? undefined
  debug.destTownCode = destCode ?? undefined
  const origTown: TownRecord | null = origCode ? data.townByCode.get(norm(origCode)) ?? null : null
  const destTown: TownRecord | null = destCode ? data.townByCode.get(norm(destCode)) ?? null : null
  const oHub = origTown?.tariffHub ?? null
  const dHub = destTown?.tariffHub ?? null
  debug.oTariffHub = oHub ?? undefined
  debug.dTariffHub = dHub ?? undefined

  // BLNS classification (V4): cross-border if either hub is a BLNS hub.
  const blns: RouteResult['blns'] =
    (oHub && BLNS_HUBS.has(norm(oHub))) || (dHub && BLNS_HUBS.has(norm(dHub)))
      ? 'BLNS'
      : norm(oHub ?? '') === 'INT' || norm(dHub ?? '') === 'INT'
        ? 'INT'
        : 'LOC'

  // SLA type (W4) and SLA text (L4). Computed even when zones fail below.
  let slaType: string | null = null
  let sla: string | undefined
  if (oHub && dHub) {
    const oFac = data.townByCode.get(norm(oHub))?.slaFacility
    const dFac = data.townByCode.get(norm(dHub))?.slaFacility
    if (oFac && dFac) slaType = data.slaTypeByPair.get(norm(oFac + dFac)) ?? null
    debug.slaType = slaType ?? undefined

    if (slaType) {
      if (blns === 'LOC') {
        // Band from the hub-of-hub pair, then service+slaType+band in N:P.
        const oHubHub = data.townByCode.get(norm(oHub))?.tariffHub
        const dHubHub = data.townByCode.get(norm(dHub))?.tariffHub
        const band =
          oHubHub && dHubHub ? data.routeBandByRoute.get(norm(`${oHubHub}-${dHubHub}`)) : undefined
        if (band !== undefined) sla = data.slaTextByLookup.get(norm(`${svc}${slaType}${band}`))
      } else {
        // BLNS/INT: band from the hub pair directly, key service-<initial><band> in U:V.
        const band = data.routeBandByRoute.get(norm(`${oHub}-${dHub}`))
        if (band !== undefined) sla = data.blnsSlaByLookup.get(norm(`${svc}-${slaType[0]}${band}`))
      }
    }
  }

  // Financial-list zones and branches (M4, N4, O4, P4).
  const finO = financialLookup(data, origin, originPostcode)
  const finD = financialLookup(data, destination, destPostcode)
  if (!finO) return { ok: false, error: 'Check Origin Town / Postal Code', blns, sla, debug }
  if (!finD) return { ok: false, error: 'Check Destination Town / Postal Code', blns, sla, debug }
  debug.puZone = finO.zone
  debug.delZone = finD.zone
  debug.opsOrigin = finO.branch
  debug.opsDest = finD.branch

  // Balance (Q4): line-haul legs for "opsO-opsD-Service", plus one.
  const legs = data.linehaulLegsByDesc.get(norm(`${finO.branch}-${finD.branch}-${svc}`))
  const balance = legs !== undefined ? legs + 1 : ('No' as const)
  debug.balance = balance

  // Element (G4): direct override, else PUzone + Delzone + Balance, capped at 30.
  const puZone = Number(finO.zone)
  const delZone = Number(finD.zone)
  if (!(puZone > 0 && delZone > 0 && typeof balance === 'number' && balance > 0)) {
    return { ok: false, error: 'Not Found', blns, sla, debug }
  }
  const overrideKey = norm(`${finO.zone}_${finD.zone}_${finO.branch}-${finD.branch}-${svc}`)
  const element = Math.min(
    data.linehaulOverrideByKey.get(overrideKey) ?? puZone + delZone + balance,
    30,
  )

  return { ok: true, element, sla, blns, debug }
}
