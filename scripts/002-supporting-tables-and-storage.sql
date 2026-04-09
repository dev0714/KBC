-- ============================================================
-- Supporting tables for product images, quotes, and documents
-- Product images stored in Supabase Storage bucket 'product-images'
-- ============================================================

-- 1. Product images table (linked to products via SKU)
CREATE TABLE IF NOT EXISTS public.product_images (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_sku text NOT NULL REFERENCES public.products(sku) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  alt_text text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_sku ON public.product_images(product_sku);

-- 2. Quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quote_number text NOT NULL UNIQUE,
  client_account_no text NOT NULL REFERENCES public.clients(account_no),
  quote_date timestamptz NOT NULL DEFAULT now(),
  expiry_date timestamptz NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  total_tax_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Converted', 'Cancelled')),
  converted_order_id bigint REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Quote items table
CREATE TABLE IF NOT EXISTS public.quote_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quote_id bigint NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  sku text NOT NULL REFERENCES public.products(sku),
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL,
  tax numeric NOT NULL DEFAULT 0
);

-- 4. Documents table (invoices, receipts, certificates stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS public.documents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_account_no text NOT NULL REFERENCES public.clients(account_no),
  order_id bigint REFERENCES public.orders(id),
  document_type text NOT NULL CHECK (document_type IN ('Invoice', 'Receipt', 'Certificate', 'Statement', 'CreditNote')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_size text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_client ON public.documents(client_account_no);
CREATE INDEX idx_documents_order ON public.documents(order_id);

-- 5. Add dimensions column to products table if not present
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions text;

-- ============================================================
-- Supabase Storage bucket setup (run via Supabase dashboard or API)
-- ============================================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow public read for product images
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Storage policies: allow authenticated users to upload product images (admin)
CREATE POLICY "Admin upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

-- Storage policies: authenticated users can read their documents
CREATE POLICY "Authenticated read documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- ============================================================
-- Seed products first (required before product_images due to FK)
-- ============================================================

INSERT INTO public.products (sku, title, product_type, description, price, inventory_quantity, dimensions) VALUES
  ('BS-HD-001', 'Brake Shoe Set HD', 'Brake Components', 'Heavy-duty brake shoe set for commercial vehicles', 1200, 45, '280x120x25mm'),
  ('BP-LD-001', 'Brake Pad Kit', 'Brake Components', 'Light-duty brake pad kit for passenger vehicles', 850, 67, '250x100x15mm'),
  ('CP-HD-001', 'Clutch Plate Assembly', 'Clutch Components', 'Heavy-duty clutch plate assembly', 2450, 28, '228x150x3mm'),
  ('PP-LD-001', 'Pressure Plate', 'Clutch Components', 'Light-duty pressure plate', 1650, 34, '220x145x5mm'),
  ('BD-HD-001', 'Brake Disc Set', 'Brake Components', 'Heavy-duty brake disc set', 1895, 52, '330x80x15mm'),
  ('BK-LD-001', 'Bearing Kit', 'Hydraulic & Bearings', 'Standard bearing kit', 745, 89, '45x100x25mm')
ON CONFLICT (sku) DO UPDATE SET
  dimensions = EXCLUDED.dimensions,
  updated_at = now();

-- ============================================================
-- Seed product_images (now that products exist)
-- ============================================================

INSERT INTO public.product_images (product_sku, file_name, storage_path, alt_text, is_primary, sort_order) VALUES
  ('BS-HD-001', 'brake-shoe-set-hd.jpg', 'products/BS-HD-001/brake-shoe-set-hd.jpg', 'Brake Shoe Set HD', true, 0),
  ('BP-LD-001', 'brake-pad-kit.jpg', 'products/BP-LD-001/brake-pad-kit.jpg', 'Brake Pad Kit', true, 0),
  ('CP-HD-001', 'clutch-plate-assembly.jpg', 'products/CP-HD-001/clutch-plate-assembly.jpg', 'Clutch Plate Assembly', true, 0),
  ('PP-LD-001', 'pressure-plate.jpg', 'products/PP-LD-001/pressure-plate.jpg', 'Pressure Plate', true, 0),
  ('BD-HD-001', 'brake-disc-set.jpg', 'products/BD-HD-001/brake-disc-set.jpg', 'Brake Disc Set', true, 0),
  ('BK-LD-001', 'bearing-kit.jpg', 'products/BK-LD-001/bearing-kit.jpg', 'Bearing Kit', true, 0)
ON CONFLICT DO NOTHING;
