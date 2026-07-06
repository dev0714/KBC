# Courier Quoting Engine — Design & Logic Spec

> Reverse-engineered from three linked workbooks used by **West Point Trading 55 CC**:
> `BPP_Element_Estimator.xlsm`, `WEST_POINT_TRADING_55_CC__DSV_Rates.xlsx`, `Courier_Comparison_v2.xlsm`.
> This spec is the source of truth for the rebuild. Every formula below is captured verbatim from the sheets.

## 1. Purpose

Given a shipment (origin town + postcode, destination town + postcode, service level, weight), produce:

1. A **DSV "Element"** (1–30) — the routing/commodity index into the DSV rate card.
2. An **SLA / lead time** (e.g. `"2 days by 17h00"`).
3. A **price per carrier** (MJV and DSV today; model is carrier-agnostic).
4. A **recommendation**: cheapest carrier + rand difference, with optional parcel-split optimisation.

## 2. The three workbooks map to three engine stages

| Workbook | Role | Becomes |
|---|---|---|
| `BPP_Element_Estimator.xlsm` | Route resolution: town → codes → zones → Element + SLA | `resolveRoute()` + reference tables |
| `WEST_POINT_TRADING_55_CC__DSV_Rates.xlsx` | DSV rate card: Element × weight band → price | `rate_cards` data + `priceDSV()` |
| `Courier_Comparison_v2.xlsm` | Quote front-end: MJV vs DSV + split + recommend | `priceMJV()`, `optimiseSplit()`, `compare()` |

The `#REF!` errors in the current files are broken cross-workbook links (`[1]Table 1`, `[2]INPUT`); the tool only works when all three sit in `z:/courier/`. The rebuild removes that coupling.

## 3. Stage 1 — Route resolution (BPP Element Estimator, `INPUT` sheet)

Inputs per row: `B=Origin`, `C=Origin Postcode`, `D=Destination`, `E=Dest Postcode`, `F=Service` (Economy/Express).

Derived columns and their formulas (row 4 shown; `TRIM`/`NUMBERVALUE` normalise whitespace and numeric postcodes):

| Col | Name | Logic (paraphrased from formula) |
|---|---|---|
| R | `orig_towncode` | `MB_TownList[Town→TownCode]`, fallback `MB_Suburblist` |
| S | `dest_towncode` | same for destination |
| X | `O TariffHub` | `MB_TownList[TownCode→TariffHub]` |
| Y | `D TariffHub` | same for destination |
| T/U | `O Ops`/`D Ops` | `MB_TownList[TownCode→OpsBranch]` |
| Z/AA | `ozone`/`dzone` | `MB_TownList[TownCode→Zone]` |
| M | `PU zone` | `BPP_FinancialTownlist[Town+Postcode→Zone]` (pickup) |
| N | `Del zone` | same for delivery |
| O/P | `OPS origin/dest` | `BPP_FinancialTownlist[Town+Postcode→Branch]` |
| V | `BLNS` | `BLNS` if any hub ∈ {GBE,MBE,MSU,MTS,WDH}; `INT` if any = INT; else `LOC` |
| W | `SLA Type` | `SLA lookups[origType+destType → HUB/Branch/Regional…]` |
| Q | `Balance` | `LH&Terminal[OpsOrig-OpsDest-Service → legs] + 1`, else `No` |
| **G** | **Element** | see below |
| **L** | **SLA** | see below |

### 3.1 Element (INPUT!G4) — core formula

```
Element = IF(TODAY()>Control!B2, "",                       // rate card expiry guard
           IF(ISERROR(PUzone),  "Check Origin Town / Postal Code",
           IF(ISERROR(Delzone), "Check Destination Town / Postal Code",
             MIN(
               IFERROR(
                 IF(AND(PUzone>0, Delzone>0, Balance>0),
                    IFNA( LH&Terminal[PUzone_Delzone_OpsO-OpsD-Service → Total], // direct long-haul override
                          PUzone + Delzone + Balance ),                          // else summed legs
                    "Not Found"),
                 "Not Found"),
               30)                                                               // hard cap at 30
           )))
```

Plain English: **Element = min( direct long-haul lookup OR (PUzone + Delzone + Balance), 30 )**, with guards for expired rate card and unresolved towns.

### 3.2 SLA (INPUT!L4)

```
IF(BLNS = "LOC":
   SLA = SLA lookups[ Service + SLAType + route(hub-hub band) → SLA string ]   // N:P table
ELSE:
   SLA = SLA lookups[ Service + facilityCode + hub-hub band → BLNS SLA string ] // U:V table
```

The `SLA lookups` sheet holds the day matrices: `Service (Economy/Express) × Facility (Hub/Branch/Outlying Adhoc) × Route band (1–9) → SLA DAYS → "N days by HH:MM"`.

### 3.3 Reference tables (become Postgres tables)

| Sheet | Rows | Content | Key columns |
|---|---|---|---|
| `MB_TownList` | 1,565 | Town → code, tariff hub, ops branch, province, town type, zone, SLA facility | TownCode, TariffHub, OpsBranch, Zone |
| `MB_Suburblist` | 34,492 | Suburb → town code (fallback resolution) | Suburb, TownCode |
| `BPP_FinancialTownlist` | 22,588 | Town+postcode → billing zone + branch, **effective-dated** (From/Till Date) | City, PostCode range, Zone, Branch |
| `Townslist` | 9,925 | Town → billing town, zone, ops branch | TownName, Zone, OpsBranch |
| `LH&Terminal` | 1,899 | Long-haul/terminal leg counts + direct overrides | Route key, Total/legs |
| `SLA lookups` | 461 | SLA day matrices + route-type maps | composite keys |
| `Sheet4` | 32 | Ops branch → tariff hub alias map | Branch↔Branch |
| `Control` | — | Rate-card expiry date | B2 |

## 4. Stage 2 — DSV rate card (`WEST_POINT_TRADING_55_CC__DSV_Rates.xlsx`)

Structure: **Elements 1–30 down the rows**, **weight bands across columns**:

```
1–<5 | 5–<10 | 10–<15 | 15–<20 | 20–<25 | 25–<30 | 30–<35 | 35–<40 | 40–<45 | 45–<50 | 50–<60 | … | over 350 (per-kilo)
```

- Each cell = rand price for (Element, weight band).
- **Minimum charge R37.11** per shipment.
- Bands up to `50–<60` are `R/Shipment`; the top band (`Over 350`) is `R/Kilo`.
- **Fuel surcharge** applied on top (Courier_Comparison uses levy `1.306` i.e. +30.6%; DSV levy is versioned monthly).
- **Accessorials** (per-shipment add-ons, currently blank/optional): After Hours, Same Day, Sat/Public Holiday, Sunrise, Retail, GRV Fee, Client Own, BLNS Customs.
- Header carries metadata: Account Name, Representative, effective Date — so rate cards are **effective-dated and per-account**.

`priceDSV(element, weightKg) = max(R37.11, rateCardCell(element, band(weightKg))) × (1 + fuelLevy) + accessorials`

## 5. Stage 3 — Comparison front-end (`Courier_Comparison_v2.xlsm`)

### 5.1 MJV price (their own reseller rate)

Destination town classified **Main / Local / Outlying** (via `Table8` city→classification, 1000 rows). Per-area rates (`MJVArea` / `Lists`):

| Area | Rate/kg | R/KG TA | Fuel levy |
|---|---|---|---|
| Main | 55 | 2 | 0.46 |
| Local | 50 | 1 | 0.46 |
| Outlying | 65 | 2.5 | 0.46 |

```
MJV_base   = VLOOKUP(area) rate per kg                 // C33
MJV_TA     = IF(weight>10, weight-10, 0) × R/KG_TA      // C35  (surcharge only on weight above 10kg)
MJV_total  = (MJV_base + MJV_TA) × (1 + fuelLevy)       // C37 : C36 = fuelLevy+1
```

> Note: current sheet applies `rate/kg` as the base add (not ×weight) plus the TA term — replicate **exactly** against the worked examples; do not "fix" apparent oddities until a golden test confirms intent.

### 5.2 DSV with parcel splitting

DSV banding is per-parcel, so one heavy shipment can be cheaper split into up to **4 parcels** (`Table6`, columns H:K; `Split Package` boolean, `No Of Packages`). Each split parcel is priced independently via `priceDSV`, then summed (`L37 = SUM(H37:K37)`). A package check validates that the split weights sum back to the total and parcel count matches.

```
optimiseSplit(totalWeight, element, maxParcels=4):
   evaluate splitting totalWeight into 1..maxParcels parcels
   price each candidate split via priceDSV, sum, keep the cheapest
```

### 5.3 Recommendation (Sheet1!C45)

```
IF(MJV_total < DSV_total):  "Cheapest: MJV,  Difference: R(DSV−MJV)"
ELSE:                       "Cheapest: DSV,  Difference: R(MJV−DSV)"
```

## 6. Carrier-agnostic generalisation (per decision: "extensible to more")

Model carriers as data, not code:

- `carriers(id, name, active)`
- `rate_models`: one of `{zone_element_band}` (DSV) or `{area_perkg}` (MJV) — a discriminated pricing strategy.
- `rate_cards(carrier_id, effective_from, effective_to, fuel_levy, account_ref)`
- `rate_card_cells(rate_card_id, element, weight_band, price)` (for element/band carriers)
- `area_rates(rate_card_id, area, rate_per_kg, ta_per_kg, fuel_levy)` (for per-kg carriers)

`priceCarrier(carrier, route, weight)` dispatches on the carrier's `rate_model`. Adding a 3rd courier = insert rows + (only if a genuinely new pricing shape) one new strategy function.

## 7. Golden test set

The 30 populated rows in `INPUT` are worked examples with expected Element + SLA already computed (e.g. `Johannesburg→Durban Economy = Element 2, "1 days by 17h00"`; `Bloemfontein→Cape Town = 16, "2 days"`; `Johannesburg→Swakopmund (BLNS) = 23, "5 days"`). These become the engine's regression fixtures — the port is "done" only when it reproduces all 30 exactly. Courier_Comparison worked example: `Johannesburg→Durban, 757kg, Main → MJV R2261.54`.

## 8. Known risks

1. **Exact-match town lookups** — the sheet uses strict `VLOOKUP`; misspellings/casing return `"Check Origin Town"`. Rebuild needs normalisation + autocomplete.
2. **Effective-dated rate cards** — DSV fuel levy changes monthly (`Lists` tracks history); `Control!B2` is an expiry guard. Rate data must be versioned.
3. **Data volume/quality** — ~68k reference rows total; import must dedupe and index for sub-100ms town resolution.
4. **Replicate-before-refactor** — some MJV math looks unusual; lock behaviour with golden tests before any "correction".
