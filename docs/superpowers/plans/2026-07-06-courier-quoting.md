# Courier Quoting Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Companion spec (source of truth for all formulas): `docs/superpowers/specs/2026-07-06-courier-quoting-design.md`

**Goal:** Rebuild West Point Trading's three-workbook courier quoting tool as a single feature inside the KBC app: enter origin, destination, weight, and service level → get the DSV Element, SLA/lead time, and a carrier price comparison (MJV vs DSV) with a cheapest-carrier recommendation and parcel-split optimisation.

**Decisions (confirmed with owner):**
- **Home:** inside the existing KBC Next.js + Supabase app, reusing the admin auth/shell.
- **Users:** internal staff only (behind admin login; shows raw carrier numbers).
- **Carriers:** MJV + DSV now, but the rate model is carrier-agnostic so a 3rd/4th courier is data, not a rewrite.

**Architecture:** Reference and rate data live in Supabase (indexed, effective-dated). A pure TypeScript engine in `lib/courier/` ports the three calc stages and is unit-tested against the spreadsheet's 30 golden examples. Service-role API routes expose quoting + town search + admin rate management. UI is a new `/admin/quote` screen plus an admin rate-card manager, matching the existing admin shell.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (Postgres + service-role routes as already used in `lib/supabase/service.ts`), existing shadcn/ui components.

---

## File Structure

- Create: `supabase/migrations/2026xxxx_courier_quoting_schema.sql`
- Create: `scripts/import-courier-reference.ts` (CSV → Supabase loader)
- Create: `lib/courier/types.ts`
- Create: `lib/courier/resolve-route.ts` (Stage 1: town → Element + SLA)
- Create: `lib/courier/pricing.ts` (Stage 2/3: priceDSV, priceMJV, dispatch)
- Create: `lib/courier/optimise-split.ts` (parcel-split optimisation)
- Create: `lib/courier/compare.ts` (recommendation)
- Create: `lib/courier/__tests__/golden.test.ts` (30 INPUT rows + comparison example)
- Create: `app/api/admin/quote/route.ts`
- Create: `app/api/admin/towns/search/route.ts`
- Create: `app/api/admin/rate-cards/route.ts`
- Create: `app/admin/quote/page.tsx`
- Create: `components/admin/quote/quote-form.tsx`, `quote-result.tsx`, `town-autocomplete.tsx`
- Create: `app/admin/rate-cards/page.tsx` (admin rate-card manager)
- Modify: `app/admin/page.tsx` (add "Quote" + "Rate Cards" nav entries)
- Create (Phase 0 outputs): `data/courier/*.csv` (extracted reference tables)

---

## Phase 0 — Extraction & golden data

### Task 0.1: Export reference tables and rate cards to clean CSV
**Files:** `data/courier/*.csv`, `scripts/extract-courier-xlsx.py`
- [ ] Extract each sheet to CSV: `mb_townlist`, `mb_suburblist`, `bpp_financial_townlist`, `townslist`, `lh_terminal`, `sla_lookups`, `sheet4_branch_map`.
- [ ] Extract DSV rate card to long form: `(element, weight_band, price)` + header metadata (account, effective date, minimum, fuel levy).
- [ ] Extract MJV area rates: `(area, rate_per_kg, ta_per_kg, fuel_levy)` and Table8 `city → classification`.
- [ ] Normalise: trim whitespace, uppercase town keys, coerce postcodes, drop fully-empty rows, record row counts.

### Task 0.2: Capture the golden test fixtures
**Files:** `lib/courier/__tests__/fixtures.json`
- [ ] Encode all 30 `INPUT` rows as `{origin, originPc, dest, destPc, service} → {element, sla}`.
- [ ] Encode the Courier_Comparison worked example(s) (e.g. JHB→DUR 757kg Main → MJV R2261.54).

---

## Phase 1 — Data layer

### Task 1.1: Schema migration
**Files:** `supabase/migrations/2026xxxx_courier_quoting_schema.sql`
- [ ] Reference tables: `courier_towns`, `courier_suburbs`, `courier_financial_townlist` (effective-dated), `courier_townslist`, `courier_lh_terminal`, `courier_sla_lookups`, `courier_branch_map`.
- [ ] Carrier/rate tables: `carriers`, `rate_cards` (carrier_id, effective_from/to, fuel_levy, account_ref, expiry), `rate_card_cells` (element, weight_band, price), `area_rates` (area, rate_per_kg, ta_per_kg).
- [ ] Indexes for resolution: normalised town-name index, `(town, postcode_range)` on financial townlist, composite keys on SLA/LH tables.
- [ ] Enable RLS; expose only via service-role routes (follow the pattern in the recent RLS-hardening commit).

### Task 1.2: CSV loader
**Files:** `scripts/import-courier-reference.ts`
- [ ] Idempotent upsert of all Phase 0 CSVs into the tables above; log inserted/skipped counts.
- [ ] Load the DSV rate card + MJV area rates as an initial effective-dated `rate_card` set.

---

## Phase 2 — Quoting engine (pure, test-first)

### Task 2.1: Route resolution
**Files:** `lib/courier/resolve-route.ts`, `lib/courier/types.ts`
- [ ] Port town→code→hub→ops→zone chain with `MB_TownList` then `MB_Suburblist` fallback.
- [ ] Compute `PUzone`, `Delzone`, `Balance`, `BLNS` classification, `SLAType`.
- [ ] Compute `Element = MIN(directLH override OR PUzone+Delzone+Balance, 30)` with the guards from spec §3.1.
- [ ] Compute SLA per spec §3.2 (LOC vs BLNS branches).
- [ ] Return structured result incl. `"Check Origin/Destination Town"` states for unresolved input.
- [ ] **Test against all 30 golden rows — must match Element + SLA exactly.**

### Task 2.2: Pricing + carrier dispatch
**Files:** `lib/courier/pricing.ts`
- [ ] `priceDSV(element, weight, rateCard)`: band select, `max(min, cell) × (1+fuel) + accessorials`.
- [ ] `priceMJV(area, weight, areaRate)`: `(base + TA over 10kg) × (1+fuel)` — replicate sheet exactly.
- [ ] `priceCarrier()` dispatch on `rate_model` (`zone_element_band` | `area_perkg`).
- [ ] **Test MJV worked example to the cent.**

### Task 2.3: Split optimisation + comparison
**Files:** `lib/courier/optimise-split.ts`, `lib/courier/compare.ts`
- [ ] `optimiseSplit(weight, element, card, maxParcels=4)` → cheapest parcel split.
- [ ] `compare(quotes)` → cheapest carrier + rand difference + per-carrier breakdown.

---

## Phase 3 — API + internal UI

### Task 3.1: API routes (service-role)
**Files:** `app/api/admin/quote/route.ts`, `app/api/admin/towns/search/route.ts`
- [ ] `POST /api/admin/quote` → `{ element, sla, carriers[], recommendation }`.
- [ ] `GET /api/admin/towns/search?q=` → normalised autocomplete (fixes exact-match fragility).

### Task 3.2: Quote screen
**Files:** `app/admin/quote/page.tsx`, `components/admin/quote/*`, `app/admin/page.tsx`
- [ ] Form: origin + postcode, destination + postcode (autocomplete), service, weight, split toggle.
- [ ] Result: Element, SLA, per-carrier price table, highlighted recommendation + difference.
- [ ] Add "Quote" nav entry to the admin shell.

---

## Phase 4 — Admin rate-card management

### Task 4.1: Rate-card manager
**Files:** `app/admin/rate-cards/page.tsx`, `app/api/admin/rate-cards/route.ts`
- [ ] List rate cards with effective dates + fuel levies per carrier.
- [ ] Upload a new DSV rate card / edit MJV area rates / set fuel levy with an effective date (no more spreadsheet editing).
- [ ] Add a new carrier (data-only path validating the "extensible" decision).

---

## Phase 5 — Hardening

- [ ] Fuzzy town matching + "did you mean" for unresolved towns.
- [ ] Rate-card expiry warning (port `Control!B2` guard) surfaced in the UI.
- [ ] Quote audit log (who quoted what, when, which rate-card version).
- [ ] typecheck clean over baseline; all golden tests green.

---

## Sequencing & estimate

| Phase | Deliverable | Rough effort |
|---|---|---|
| 0 | CSVs + golden fixtures | ½–1 day |
| 1 | Supabase schema + loader | 1–2 days |
| 2 | Engine reproduces all 30 examples | 2–3 days |
| 3 | Quote API + screen | 2–3 days |
| 4 | Rate-card admin | 1–2 days |
| 5 | Hardening | ongoing |

**Definition of done for the core:** an internal user quotes JHB→DUR 757kg Economy and gets Element 2, the correct SLA, MJV vs DSV prices, and a recommendation — matching the spreadsheet — with rate cards editable in-app.
