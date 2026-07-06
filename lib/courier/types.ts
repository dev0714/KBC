export type Service = 'Economy' | 'Express'

export interface TownRecord {
  townCode: string
  tariffHub: string
  opsBranch: string
  townName: string
  slaFacility: string
  zone: number | null
}

export interface FinancialTown {
  lookup: string // city + optional postcode, as the estimator keys it
  branch: string
  zone: string // numeric string in practice; kept raw for exact parity
}

/**
 * All reference data the engine needs, pre-indexed. Keys are normalised with
 * norm() (trim + uppercase) because Excel VLOOKUP is case-insensitive.
 * Implemented by the CSV-backed provider today and a Supabase-backed one later.
 */
export interface CourierData {
  townByName: Map<string, TownRecord>
  townByCode: Map<string, TownRecord>
  suburbToTownCode: Map<string, string>
  financialByLookup: Map<string, FinancialTown>
  linehaulLegsByDesc: Map<string, number>
  linehaulOverrideByKey: Map<string, number>
  slaTypeByPair: Map<string, string> // origFacility+destFacility -> SLA type
  routeBandByRoute: Map<string, number> // "BFN-CPT" -> band 1..9
  slaTextByLookup: Map<string, string> // "EconomyBranch1" -> "1 days by 17h00"
  blnsSlaByLookup: Map<string, string> // "Economy-B4" -> "4 days by 17h00"
  rateCardExpiry: Date | null
}

export interface RouteResult {
  ok: boolean
  error?: string // "Check Origin Town / Postal Code" etc, matching the sheet
  element?: number
  sla?: string
  blns?: 'LOC' | 'BLNS' | 'INT'
  debug: {
    origTownCode?: string
    destTownCode?: string
    oTariffHub?: string
    dTariffHub?: string
    opsOrigin?: string
    opsDest?: string
    puZone?: string
    delZone?: string
    balance?: number | 'No'
    slaType?: string
  }
}

export interface RateCell {
  element: number
  bandMinKg: number
  bandMaxKg: number | null // null = open-ended top band
  bandLabel: string
  perUnit: 'shipment' | 'kg'
  price: number
}

export interface DsvRateCard {
  service: Service
  minimum: number
  fuelLevy: number
  cells: RateCell[]
}

export interface MjvAreaRate {
  area: string // Main | Local | Outlying
  ratePerKg: number
  taPerKg: number
  taThresholdKg: number
  fuelLevy: number
  /** 'flat_once' = base rate added once (sheet behaviour); 'per_kg' = base x weight. */
  baseMode: 'flat_once' | 'per_kg'
}

export interface CarrierQuote {
  carrier: string
  total: number
  breakdown: Record<string, number | string>
  parcels?: number[] // weights, when a split was applied
}

export interface Comparison {
  quotes: CarrierQuote[]
  cheapest: string
  difference: number
}

export const norm = (v: string | null | undefined): string =>
  (v ?? '').trim().toUpperCase().replace(/\s+/g, ' ')
