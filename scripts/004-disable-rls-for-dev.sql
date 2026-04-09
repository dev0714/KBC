-- ============================================================
-- Disable RLS on all tables for development
-- Re-enable and add proper policies once auth is implemented
-- ============================================================

-- Disable RLS on core tables
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quote_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents DISABLE ROW LEVEL SECURITY;

-- Also add permissive policies in case RLS gets re-enabled
-- These allow the anon key to read all data
DO $$
BEGIN
  -- clients
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Allow public read clients') THEN
    CREATE POLICY "Allow public read clients" ON public.clients FOR SELECT USING (true);
  END IF;
  -- products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow public read products') THEN
    CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
  END IF;
  -- orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow public read orders') THEN
    CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
  END IF;
  -- order_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Allow public read order_items') THEN
    CREATE POLICY "Allow public read order_items" ON public.order_items FOR SELECT USING (true);
  END IF;
  -- quotes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Allow public read quotes') THEN
    CREATE POLICY "Allow public read quotes" ON public.quotes FOR SELECT USING (true);
  END IF;
  -- quote_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_items' AND policyname = 'Allow public read quote_items') THEN
    CREATE POLICY "Allow public read quote_items" ON public.quote_items FOR SELECT USING (true);
  END IF;
  -- product_images
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'Allow public read product_images') THEN
    CREATE POLICY "Allow public read product_images" ON public.product_images FOR SELECT USING (true);
  END IF;
  -- documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow public read documents') THEN
    CREATE POLICY "Allow public read documents" ON public.documents FOR SELECT USING (true);
  END IF;
END $$;
