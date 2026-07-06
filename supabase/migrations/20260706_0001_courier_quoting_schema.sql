-- Courier quoting schema for KBC (West Point Trading courier engine).
-- Reference data extracted from the BPP Element Estimator / DSV Rates /
-- Courier Comparison workbooks. See docs/superpowers/specs/2026-07-06-courier-quoting-design.md.
-- Apply this migration to the SAME Supabase project used by NEXT_PUBLIC_SUPABASE_URL.

-- ---------------------------------------------------------------- reference

-- MB_TownList: town code -> tariff hub / ops branch / zone / SLA facility.
CREATE TABLE IF NOT EXISTS public.courier_towns (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  town_code text NOT NULL,
  tariff_hub text NOT NULL,
  ops_branch text NOT NULL,
  town_name text NOT NULL,
  province text,
  town_type text,
  sla_facility text,
  zone smallint,
  town_name_norm text GENERATED ALWAYS AS (upper(btrim(town_name))) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS courier_towns_name_norm_idx ON public.courier_towns (town_name_norm);
CREATE INDEX IF NOT EXISTS courier_towns_code_idx ON public.courier_towns (town_code);

-- MB_Suburblist: suburb -> town code (fallback resolution).
CREATE TABLE IF NOT EXISTS public.courier_suburbs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  suburb text NOT NULL,
  town_code text NOT NULL,
  suburb_norm text GENERATED ALWAYS AS (upper(btrim(suburb))) STORED
);
CREATE INDEX IF NOT EXISTS courier_suburbs_norm_idx ON public.courier_suburbs (suburb_norm);

-- BPP_FinancialTownlist: town (+ postcode range) -> pickup/delivery zone + ops branch.
-- Effective-dated in the source; both dates preserved.
CREATE TABLE IF NOT EXISTS public.courier_financial_towns (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city text NOT NULL,
  from_postcode text,
  thru_postcode text,
  branch text,
  zone smallint,
  service_level text,
  from_date date,
  till_date date,
  city_norm text GENERATED ALWAYS AS (upper(btrim(city))) STORED
);
CREATE INDEX IF NOT EXISTS courier_financial_towns_city_idx ON public.courier_financial_towns (city_norm);

-- Townslist: town -> billing town / zone / ops branch.
CREATE TABLE IF NOT EXISTS public.courier_billing_towns (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  town_name text NOT NULL,
  billing_town text,
  zone smallint,
  ops_branch text,
  town_name_norm text GENERATED ALWAYS AS (upper(btrim(town_name))) STORED
);
CREATE INDEX IF NOT EXISTS courier_billing_towns_norm_idx ON public.courier_billing_towns (town_name_norm);

-- LH&Terminal: line-haul legs between ops branches per service.
CREATE TABLE IF NOT EXISTS public.courier_linehaul (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  orig_branch text NOT NULL,
  dest_branch text NOT NULL,
  product_desc text NOT NULL,
  total_legs smallint NOT NULL
);
CREATE INDEX IF NOT EXISTS courier_linehaul_desc_idx ON public.courier_linehaul (product_desc);

-- Direct long-haul element overrides: "PUzone_Delzone_OpsO-OpsD-Service" -> element.
CREATE TABLE IF NOT EXISTS public.courier_linehaul_overrides (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lookup_key text NOT NULL UNIQUE,
  element smallint NOT NULL
);

-- SLA matrices, split from the SLA lookups sheet into its logical tables.
CREATE TABLE IF NOT EXISTS public.courier_sla_type_map (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  orig_type text NOT NULL,
  dest_type text NOT NULL,
  sla_type text NOT NULL,
  sla_type_code text
);

CREATE TABLE IF NOT EXISTS public.courier_sla_route_bands (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route text NOT NULL UNIQUE, -- e.g. "BFN-CPT" (tariff-hub pair)
  band smallint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courier_sla_matrix (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service text NOT NULL,        -- Economy | Express
  facility_type text NOT NULL,  -- Hub | Branch | Outlying Adhoc | ...
  route_band smallint NOT NULL,
  sla_days smallint,
  sla_text text NOT NULL,
  lookup text NOT NULL          -- source composite key, kept for parity checks
);
CREATE INDEX IF NOT EXISTS courier_sla_matrix_lookup_idx ON public.courier_sla_matrix (lookup);

-- Cross-border (BLNS) SLA lookups, keyed as in the sheet's U:V table.
CREATE TABLE IF NOT EXISTS public.courier_sla_blns (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lookup text NOT NULL,
  sla_text text NOT NULL
);
CREATE INDEX IF NOT EXISTS courier_sla_blns_lookup_idx ON public.courier_sla_blns (lookup);

-- Ops branch -> tariff branch alias map (estimator Sheet4).
CREATE TABLE IF NOT EXISTS public.courier_branch_map (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ops_branch text NOT NULL UNIQUE,
  tariff_branch text NOT NULL
);

-- City -> Main/Local/Outlying classification (MJV pricing input).
CREATE TABLE IF NOT EXISTS public.courier_city_classes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city text NOT NULL,
  classification text NOT NULL, -- MAIN | LOCAL | OUTLYING | N/A
  city_norm text GENERATED ALWAYS AS (upper(btrim(city))) STORED
);
CREATE INDEX IF NOT EXISTS courier_city_classes_norm_idx ON public.courier_city_classes (city_norm);

-- ---------------------------------------------------------------- carriers & rates

-- Carriers are data, not code. rate_model picks the pricing strategy:
--   zone_element_band : element x weight-band grid (DSV)
--   area_perkg        : per-kg by area classification (MJV)
CREATE TABLE IF NOT EXISTS public.couriers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  rate_model text NOT NULL CHECK (rate_model IN ('zone_element_band', 'area_perkg')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Effective-dated rate cards. effective_to mirrors the estimator's Control!B2
-- expiry guard: quoting past it must warn.
CREATE TABLE IF NOT EXISTS public.courier_rate_cards (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  courier_id bigint NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  service text,                 -- Economy | Express | NULL (applies to all)
  account_ref text,
  fuel_levy numeric(6,4) NOT NULL DEFAULT 0,
  minimum_charge numeric(10,2),
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS courier_rate_cards_courier_idx
  ON public.courier_rate_cards (courier_id, service, effective_from);

-- Element x weight-band grid cells (zone_element_band carriers).
CREATE TABLE IF NOT EXISTS public.courier_rate_cells (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rate_card_id bigint NOT NULL REFERENCES public.courier_rate_cards(id) ON DELETE CASCADE,
  element smallint NOT NULL,
  band_min_kg numeric(8,2) NOT NULL,
  band_max_kg numeric(8,2),      -- NULL = open-ended top band
  band_label text NOT NULL,
  per_unit text NOT NULL DEFAULT 'shipment' CHECK (per_unit IN ('shipment', 'kg')),
  price numeric(10,2) NOT NULL,
  UNIQUE (rate_card_id, element, band_label)
);
CREATE INDEX IF NOT EXISTS courier_rate_cells_lookup_idx
  ON public.courier_rate_cells (rate_card_id, element, band_min_kg);

-- Per-kg area rates (area_perkg carriers, i.e. MJV today).
-- base_mode captures the sheet's exact behaviour and stays editable:
--   flat_once : base rate added once (what Courier_Comparison_v2 does today)
--   per_kg    : base rate multiplied by weight (the conventional reading)
CREATE TABLE IF NOT EXISTS public.courier_area_rates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rate_card_id bigint NOT NULL REFERENCES public.courier_rate_cards(id) ON DELETE CASCADE,
  area text NOT NULL,            -- Main | Local | Outlying
  rate_per_kg numeric(10,2) NOT NULL,
  ta_per_kg numeric(10,2) NOT NULL DEFAULT 0,
  ta_threshold_kg numeric(8,2) NOT NULL DEFAULT 10,
  base_mode text NOT NULL DEFAULT 'flat_once' CHECK (base_mode IN ('flat_once', 'per_kg')),
  UNIQUE (rate_card_id, area)
);

-- Quote audit log (Phase 5 uses this; created now so quoting can write early).
CREATE TABLE IF NOT EXISTS public.courier_quotes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quoted_by text,
  origin text NOT NULL,
  origin_postcode text,
  destination text NOT NULL,
  dest_postcode text,
  service text NOT NULL,
  weight_kg numeric(8,2) NOT NULL,
  element smallint,
  sla_text text,
  results jsonb NOT NULL,        -- per-carrier breakdown + recommendation
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- RLS
-- Same posture as the rest of the app: RLS on, no policies; access only via
-- service-role API routes (lib/supabase/service.ts) behind admin auth.

ALTER TABLE public.courier_towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_suburbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_financial_towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_billing_towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_linehaul ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_linehaul_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_sla_type_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_sla_route_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_sla_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_sla_blns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_branch_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_city_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_rate_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_area_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_quotes ENABLE ROW LEVEL SECURITY;
