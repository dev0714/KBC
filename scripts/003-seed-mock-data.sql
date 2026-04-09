-- ============================================================
-- SEED MOCK DATA - Insert order respects all FK constraints
-- 1. clients, 2. products, 3. orders, 4. order_items,
-- 5. quotes, 6. quote_items, 7. product_images, 8. documents
-- ============================================================

-- ============================================================
-- 1. CLIENTS
-- ============================================================
INSERT INTO public.clients (account_no, client_name, address) VALUES
  ('TFS-001', 'Transnet Fleet Services', '123 Fleet Road, Germiston, Johannesburg 1401'),
  ('BVC-002', 'Bidvest Cargo Logistics', '45 Cargo Drive, Cape Town 8001'),
  ('DAC-003', 'Durban Auto Components', '78 Marine Parade, Durban 4001'),
  ('PTS-004', 'Pretoria Transport Solutions', '12 Church Street, Pretoria 0002'),
  ('ELC-005', 'East London Coach Lines', '56 Oxford Street, East London 5201'),
  ('BFM-006', 'Bloemfontein Motors', '90 Voortrekker Road, Bloemfontein 9301'),
  ('NMB-007', 'Nelson Mandela Bay Logistics', '34 Settlers Way, Gqeberha 6045'),
  ('PLK-008', 'Polokwane Freight Co', '22 Grobler Street, Polokwane 0700')
ON CONFLICT (account_no) DO NOTHING;

-- ============================================================
-- 2. PRODUCTS
-- ============================================================
INSERT INTO public.products (sku, title, product_type, description, price, inventory_quantity, dimensions) VALUES
  ('BS-HD-001', 'Brake Shoe Set HD', 'Brake Components', 'Heavy-duty brake shoe set for commercial vehicles. Designed for long-haul trucks and buses.', 1200.00, 45, '280x120x25mm'),
  ('BP-LD-001', 'Brake Pad Kit', 'Brake Components', 'Light-duty brake pad kit for passenger vehicles and light commercials.', 850.00, 67, '250x100x15mm'),
  ('CP-HD-001', 'Clutch Plate Assembly', 'Clutch Components', 'Heavy-duty clutch plate assembly for commercial fleet vehicles.', 2450.00, 28, '228x150x3mm'),
  ('PP-LD-001', 'Pressure Plate', 'Clutch Components', 'Light-duty pressure plate for passenger and light commercial vehicles.', 1650.00, 34, '220x145x5mm'),
  ('BD-HD-001', 'Brake Disc Set', 'Brake Components', 'Heavy-duty ventilated brake disc set for trucks and buses.', 1895.00, 52, '330x80x15mm'),
  ('BK-LD-001', 'Bearing Kit', 'Hydraulic & Bearings', 'Standard bearing kit for general automotive applications.', 745.00, 89, '45x100x25mm'),
  ('HF-ST-001', 'Hydraulic Fluid Synthetic', 'Hydraulic & Bearings', 'Synthetic hydraulic fluid for heavy-duty brake systems. DOT 4 rated.', 680.00, 156, '1L bottle'),
  ('CK-HD-001', 'Clutch Kit Complete', 'Clutch Components', 'Complete clutch kit including plate, cover, and bearing for HD trucks.', 4250.00, 18, '350x180x45mm'),
  ('BL-HD-001', 'Brake Lining Set', 'Brake Components', 'Premium brake lining set for drum brakes on heavy commercial vehicles.', 1100.00, 73, '320x60x12mm'),
  ('WB-ST-001', 'Wheel Bearing Assembly', 'Hydraulic & Bearings', 'Front wheel bearing assembly for medium-duty trucks.', 1340.00, 41, '65x120x31mm'),
  ('BC-HD-001', 'Brake Caliper HD', 'Brake Components', 'Heavy-duty brake caliper for disc brake systems on commercial vehicles.', 3200.00, 22, '280x180x120mm'),
  ('RP-LD-001', 'Release Bearing', 'Clutch Components', 'Clutch release bearing for light-duty vehicles.', 495.00, 112, '52x35x20mm'),
  ('DS-HD-001', 'Drum Brake Assembly', 'Brake Components', 'Complete drum brake assembly for rear axle on heavy trucks.', 2800.00, 15, '420x180x180mm'),
  ('SC-ST-001', 'Slave Cylinder', 'Clutch Components', 'Clutch slave cylinder for hydraulic clutch systems.', 890.00, 64, '85x45x45mm'),
  ('MC-ST-001', 'Master Cylinder', 'Brake Components', 'Brake master cylinder for dual-circuit brake systems.', 1575.00, 37, '200x80x80mm')
ON CONFLICT (sku) DO UPDATE SET
  title = EXCLUDED.title,
  product_type = EXCLUDED.product_type,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  inventory_quantity = EXCLUDED.inventory_quantity,
  dimensions = EXCLUDED.dimensions,
  updated_at = now();

-- ============================================================
-- 3. ORDERS
-- ============================================================
INSERT INTO public.orders (order_number, client_account_no, order_date, total_amount, total_tax_amount, shipping_amount, payment_status) VALUES
  ('ORD-2024-0001', 'TFS-001', '2024-01-15 09:30:00+02', 47890.00, 7183.50, 1250.00, 'Paid'),
  ('ORD-2024-0002', 'BVC-002', '2024-01-18 14:15:00+02', 34560.00, 5184.00, 950.00, 'Paid'),
  ('ORD-2024-0003', 'DAC-003', '2024-01-22 11:00:00+02', 62340.00, 9351.00, 1800.00, 'Shipped'),
  ('ORD-2024-0004', 'PTS-004', '2024-01-25 08:45:00+02', 28450.00, 4267.50, 750.00, 'Paid'),
  ('ORD-2024-0005', 'TFS-001', '2024-02-02 10:00:00+02', 85600.00, 12840.00, 2100.00, 'Shipped'),
  ('ORD-2024-0006', 'ELC-005', '2024-02-08 13:30:00+02', 15890.00, 2383.50, 650.00, 'Pending'),
  ('ORD-2024-0007', 'BFM-006', '2024-02-12 09:00:00+02', 42100.00, 6315.00, 1100.00, 'Paid'),
  ('ORD-2024-0008', 'NMB-007', '2024-02-18 15:45:00+02', 73200.00, 10980.00, 1950.00, 'Shipped'),
  ('ORD-2024-0009', 'PLK-008', '2024-02-22 10:30:00+02', 19750.00, 2962.50, 850.00, 'Pending'),
  ('ORD-2024-0010', 'TFS-001', '2024-03-01 08:00:00+02', 56300.00, 8445.00, 1500.00, 'Pending'),
  ('ORD-2024-0011', 'BVC-002', '2024-03-05 11:15:00+02', 31400.00, 4710.00, 900.00, 'Paid'),
  ('ORD-2024-0012', 'DAC-003', '2024-03-10 14:00:00+02', 44800.00, 6720.00, 1200.00, 'Shipped')
ON CONFLICT (order_number) DO NOTHING;

-- ============================================================
-- 4. ORDER_ITEMS (references orders.id and products.sku)
-- ============================================================
INSERT INTO public.order_items (order_id, sku, quantity, price, tax) VALUES
  -- ORD-2024-0001 (TFS-001)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0001'), 'BS-HD-001', 10, 1200.00, 180.00),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0001'), 'BD-HD-001', 8, 1895.00, 284.25),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0001'), 'BL-HD-001', 12, 1100.00, 165.00),
  -- ORD-2024-0002 (BVC-002)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0002'), 'BP-LD-001', 15, 850.00, 127.50),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0002'), 'PP-LD-001', 6, 1650.00, 247.50),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0002'), 'RP-LD-001', 10, 495.00, 74.25),
  -- ORD-2024-0003 (DAC-003)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0003'), 'CP-HD-001', 8, 2450.00, 367.50),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0003'), 'CK-HD-001', 5, 4250.00, 637.50),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0003'), 'SC-ST-001', 10, 890.00, 133.50),
  -- ORD-2024-0004 (PTS-004)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0004'), 'BK-LD-001', 20, 745.00, 111.75),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0004'), 'WB-ST-001', 8, 1340.00, 201.00),
  -- ORD-2024-0005 (TFS-001)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0005'), 'BC-HD-001', 10, 3200.00, 480.00),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0005'), 'DS-HD-001', 6, 2800.00, 420.00),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0005'), 'MC-ST-001', 8, 1575.00, 236.25),
  -- ORD-2024-0006 (ELC-005)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0006'), 'BP-LD-001', 8, 850.00, 127.50),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0006'), 'HF-ST-001', 12, 680.00, 102.00),
  -- ORD-2024-0007 (BFM-006)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0007'), 'BS-HD-001', 15, 1200.00, 180.00),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0007'), 'BD-HD-001', 10, 1895.00, 284.25),
  -- ORD-2024-0008 (NMB-007)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0008'), 'CK-HD-001', 8, 4250.00, 637.50),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0008'), 'CP-HD-001', 10, 2450.00, 367.50),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0008'), 'PP-LD-001', 5, 1650.00, 247.50),
  -- ORD-2024-0009 (PLK-008)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0009'), 'BK-LD-001', 15, 745.00, 111.75),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0009'), 'RP-LD-001', 8, 495.00, 74.25),
  -- ORD-2024-0010 (TFS-001)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0010'), 'BC-HD-001', 6, 3200.00, 480.00),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0010'), 'BS-HD-001', 12, 1200.00, 180.00),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0010'), 'BL-HD-001', 15, 1100.00, 165.00),
  -- ORD-2024-0011 (BVC-002)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0011'), 'BP-LD-001', 12, 850.00, 127.50),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0011'), 'SC-ST-001', 8, 890.00, 133.50),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0011'), 'HF-ST-001', 10, 680.00, 102.00),
  -- ORD-2024-0012 (DAC-003)
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0012'), 'DS-HD-001', 4, 2800.00, 420.00),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0012'), 'MC-ST-001', 10, 1575.00, 236.25),
  ((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0012'), 'WB-ST-001', 12, 1340.00, 201.00);

-- ============================================================
-- 5. QUOTES
-- ============================================================
INSERT INTO public.quotes (quote_number, client_account_no, quote_date, expiry_date, total_amount, total_tax_amount, status, converted_order_id) VALUES
  ('QT-2024-001', 'TFS-001', '2024-02-20 10:00:00+02', '2026-06-20 10:00:00+02', 85600.00, 12840.00, 'Active', NULL),
  ('QT-2024-002', 'BVC-002', '2024-02-15 09:00:00+02', '2026-05-15 09:00:00+02', 68900.00, 10335.00, 'Active', NULL),
  ('QT-2024-003', 'DAC-003', '2024-01-10 14:00:00+02', '2024-02-10 14:00:00+02', 45200.00, 6780.00, 'Expired', NULL),
  ('QT-2024-004', 'PTS-004', '2024-03-01 08:30:00+02', '2026-06-01 08:30:00+02', 52400.00, 7860.00, 'Active', NULL),
  ('QT-2024-005', 'ELC-005', '2024-02-28 11:00:00+02', '2026-05-28 11:00:00+02', 31200.00, 4680.00, 'Active', NULL),
  ('QT-2024-006', 'NMB-007', '2024-01-05 09:00:00+02', '2024-02-05 09:00:00+02', 27800.00, 4170.00, 'Converted', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0008'))
ON CONFLICT (quote_number) DO NOTHING;

-- ============================================================
-- 6. QUOTE_ITEMS
-- ============================================================
INSERT INTO public.quote_items (quote_id, sku, quantity, price, tax) VALUES
  -- QT-2024-001
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-001'), 'BC-HD-001', 10, 3200.00, 480.00),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-001'), 'DS-HD-001', 8, 2800.00, 420.00),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-001'), 'MC-ST-001', 6, 1575.00, 236.25),
  -- QT-2024-002
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-002'), 'BP-LD-001', 20, 850.00, 127.50),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-002'), 'PP-LD-001', 12, 1650.00, 247.50),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-002'), 'RP-LD-001', 15, 495.00, 74.25),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-002'), 'HF-ST-001', 20, 680.00, 102.00),
  -- QT-2024-003
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-003'), 'CP-HD-001', 8, 2450.00, 367.50),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-003'), 'CK-HD-001', 4, 4250.00, 637.50),
  -- QT-2024-004
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-004'), 'BS-HD-001', 15, 1200.00, 180.00),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-004'), 'BD-HD-001', 10, 1895.00, 284.25),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-004'), 'BL-HD-001', 12, 1100.00, 165.00),
  -- QT-2024-005
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-005'), 'BK-LD-001', 20, 745.00, 111.75),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-005'), 'WB-ST-001', 8, 1340.00, 201.00),
  -- QT-2024-006
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-006'), 'CK-HD-001', 3, 4250.00, 637.50),
  ((SELECT id FROM public.quotes WHERE quote_number = 'QT-2024-006'), 'CP-HD-001', 5, 2450.00, 367.50);

-- ============================================================
-- 7. PRODUCT_IMAGES (storage_path references Supabase bucket)
-- ============================================================
INSERT INTO public.product_images (product_sku, file_name, storage_path, alt_text, is_primary, sort_order) VALUES
  ('BS-HD-001', 'brake-shoe-set-hd-front.jpg', 'products/BS-HD-001/brake-shoe-set-hd-front.jpg', 'Brake Shoe Set HD - Front View', true, 0),
  ('BS-HD-001', 'brake-shoe-set-hd-side.jpg', 'products/BS-HD-001/brake-shoe-set-hd-side.jpg', 'Brake Shoe Set HD - Side View', false, 1),
  ('BP-LD-001', 'brake-pad-kit-front.jpg', 'products/BP-LD-001/brake-pad-kit-front.jpg', 'Brake Pad Kit - Front View', true, 0),
  ('CP-HD-001', 'clutch-plate-assembly.jpg', 'products/CP-HD-001/clutch-plate-assembly.jpg', 'Clutch Plate Assembly', true, 0),
  ('PP-LD-001', 'pressure-plate.jpg', 'products/PP-LD-001/pressure-plate.jpg', 'Pressure Plate', true, 0),
  ('BD-HD-001', 'brake-disc-set.jpg', 'products/BD-HD-001/brake-disc-set.jpg', 'Brake Disc Set', true, 0),
  ('BK-LD-001', 'bearing-kit.jpg', 'products/BK-LD-001/bearing-kit.jpg', 'Bearing Kit', true, 0),
  ('HF-ST-001', 'hydraulic-fluid.jpg', 'products/HF-ST-001/hydraulic-fluid.jpg', 'Hydraulic Fluid Synthetic', true, 0),
  ('CK-HD-001', 'clutch-kit-complete.jpg', 'products/CK-HD-001/clutch-kit-complete.jpg', 'Clutch Kit Complete', true, 0),
  ('BL-HD-001', 'brake-lining-set.jpg', 'products/BL-HD-001/brake-lining-set.jpg', 'Brake Lining Set', true, 0),
  ('WB-ST-001', 'wheel-bearing-assembly.jpg', 'products/WB-ST-001/wheel-bearing-assembly.jpg', 'Wheel Bearing Assembly', true, 0),
  ('BC-HD-001', 'brake-caliper-hd.jpg', 'products/BC-HD-001/brake-caliper-hd.jpg', 'Brake Caliper HD', true, 0),
  ('RP-LD-001', 'release-bearing.jpg', 'products/RP-LD-001/release-bearing.jpg', 'Release Bearing', true, 0),
  ('DS-HD-001', 'drum-brake-assembly.jpg', 'products/DS-HD-001/drum-brake-assembly.jpg', 'Drum Brake Assembly', true, 0),
  ('SC-ST-001', 'slave-cylinder.jpg', 'products/SC-ST-001/slave-cylinder.jpg', 'Slave Cylinder', true, 0),
  ('MC-ST-001', 'master-cylinder.jpg', 'products/MC-ST-001/master-cylinder.jpg', 'Master Cylinder', true, 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. DOCUMENTS (storage_path references Supabase bucket)
-- ============================================================
INSERT INTO public.documents (client_account_no, order_id, document_type, file_name, storage_path, file_size) VALUES
  ('TFS-001', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0001'), 'Invoice', 'INV-2024-0001.pdf', 'documents/TFS-001/INV-2024-0001.pdf', '245KB'),
  ('TFS-001', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0001'), 'Receipt', 'REC-2024-0001.pdf', 'documents/TFS-001/REC-2024-0001.pdf', '128KB'),
  ('BVC-002', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0002'), 'Invoice', 'INV-2024-0002.pdf', 'documents/BVC-002/INV-2024-0002.pdf', '232KB'),
  ('BVC-002', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0002'), 'Receipt', 'REC-2024-0002.pdf', 'documents/BVC-002/REC-2024-0002.pdf', '118KB'),
  ('DAC-003', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0003'), 'Invoice', 'INV-2024-0003.pdf', 'documents/DAC-003/INV-2024-0003.pdf', '278KB'),
  ('PTS-004', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0004'), 'Invoice', 'INV-2024-0004.pdf', 'documents/PTS-004/INV-2024-0004.pdf', '215KB'),
  ('PTS-004', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0004'), 'Certificate', 'CERT-PTS-004.pdf', 'documents/PTS-004/CERT-PTS-004.pdf', '456KB'),
  ('TFS-001', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0005'), 'Invoice', 'INV-2024-0005.pdf', 'documents/TFS-001/INV-2024-0005.pdf', '312KB'),
  ('TFS-001', NULL, 'Statement', 'STMT-TFS-001-2024-Q1.pdf', 'documents/TFS-001/STMT-TFS-001-2024-Q1.pdf', '520KB'),
  ('ELC-005', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0006'), 'Invoice', 'INV-2024-0006.pdf', 'documents/ELC-005/INV-2024-0006.pdf', '198KB'),
  ('BFM-006', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0007'), 'Invoice', 'INV-2024-0007.pdf', 'documents/BFM-006/INV-2024-0007.pdf', '267KB'),
  ('BFM-006', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0007'), 'Receipt', 'REC-2024-0007.pdf', 'documents/BFM-006/REC-2024-0007.pdf', '135KB'),
  ('NMB-007', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0008'), 'Invoice', 'INV-2024-0008.pdf', 'documents/NMB-007/INV-2024-0008.pdf', '289KB'),
  ('NMB-007', (SELECT id FROM public.orders WHERE order_number = 'ORD-2024-0008'), 'CreditNote', 'CN-2024-0001.pdf', 'documents/NMB-007/CN-2024-0001.pdf', '156KB'),
  ('DAC-003', NULL, 'Certificate', 'CERT-DAC-003.pdf', 'documents/DAC-003/CERT-DAC-003.pdf', '478KB'),
  ('BVC-002', NULL, 'Statement', 'STMT-BVC-002-2024-Q1.pdf', 'documents/BVC-002/STMT-BVC-002-2024-Q1.pdf', '498KB');
