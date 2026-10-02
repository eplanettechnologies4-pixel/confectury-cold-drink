-- =================================================================
-- Ahmad Traders - Confectionery & Cold Drinks Distribution ERP
-- Khuram Chowk, Tezab Mills Road, Faisalabad, Pakistan
-- Phones: 03057165320, 03040402614 | Currency: PKR
-- Production-Ready PostgreSQL / Supabase Database Schema
-- =================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Staff Profiles & Roles Table
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Sales', 'Accounts', 'Inventory', 'Staff')),
  department TEXT NOT NULL,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Distribution Areas (Configurable routes in Faisalabad: Madina Town, D-Ground, etc.)
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  assigned_salesperson TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Clients / Parties Table (Stores retail shops, supermarkets, wholesalers)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  client_type TEXT NOT NULL CHECK (client_type IN ('Wholesaler', 'Supermarket', 'Retailer', 'Hotel/Restaurant', 'Distributor')),
  party_category TEXT NOT NULL DEFAULT 'B' CHECK (party_category IN ('A', 'B', 'C')),
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT,
  tax_id TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Faisalabad',
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  area TEXT NOT NULL,
  postal_code TEXT,
  sales_rep TEXT NOT NULL,
  credit_limit NUMERIC(12, 2) DEFAULT 0.00,
  payment_terms TEXT NOT NULL CHECK (payment_terms IN ('Cash', '7 Days', '15 Days', '30 Days', '45 Days', 'Custom')),
  opening_balance NUMERIC(12, 2) DEFAULT 0.00,
  balance_type TEXT NOT NULL DEFAULT 'Receivable' CHECK (balance_type IN ('Receivable', 'Payable')),
  total_purchases NUMERIC(12, 2) DEFAULT 0.00,
  total_paid NUMERIC(12, 2) DEFAULT 0.00,
  current_balance NUMERIC(12, 2) DEFAULT 0.00,
  last_transaction_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products & Catalog (Strictly Confectionery & Cold Drinks)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Confectionery', 'Cold Drinks')),
  brand TEXT NOT NULL,
  unit TEXT NOT NULL,
  purchase_unit TEXT,
  sales_unit TEXT,
  units_per_carton INT DEFAULT 24,
  units_per_pack INT DEFAULT 12,
  cost_price NUMERIC(10, 2) NOT NULL,
  selling_price NUMERIC(10, 2) NOT NULL,
  opening_stock INT NOT NULL DEFAULT 0,
  current_stock INT NOT NULL DEFAULT 0,
  reserved_stock INT NOT NULL DEFAULT 0,
  available_stock INT NOT NULL DEFAULT 0,
  min_stock_level INT NOT NULL DEFAULT 10,
  supplier TEXT NOT NULL,
  supplier_id UUID,
  description TEXT,
  image_url TEXT,
  batch_number TEXT,
  manufacturing_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  opening_payable NUMERIC(12, 2) DEFAULT 0.00,
  current_payable NUMERIC(12, 2) DEFAULT 0.00,
  payment_terms TEXT NOT NULL DEFAULT '30 Days',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Supplier Payments Table
CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque', 'Other')),
  reference_number TEXT,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Purchases Table (Multi-product daily purchase invoices)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) DEFAULT 0.00,
  additional_charges NUMERIC(12, 2) DEFAULT 0.00,
  grand_total NUMERIC(12, 2) NOT NULL,
  amount_paid NUMERIC(12, 2) DEFAULT 0.00,
  remaining_payable NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Credit', 'Partial')),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Posted', 'Cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Purchase Items
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('Confectionery', 'Cold Drinks')),
  batch_number TEXT NOT NULL,
  expiry_date DATE,
  unit TEXT NOT NULL,
  quantity INT NOT NULL,
  purchase_price NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0.00,
  line_total NUMERIC(12, 2) NOT NULL
);

-- 10. Purchase Returns
CREATE TABLE IF NOT EXISTS public.purchase_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number TEXT UNIQUE NOT NULL,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE RESTRICT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  unit TEXT NOT NULL,
  batch TEXT,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  refund_amount NUMERIC(12, 2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Centralized Inventory Transactions Log (Movement Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INT NOT NULL,
  unit TEXT,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  unit_cost NUMERIC(10, 2) NOT NULL,
  total_cost NUMERIC(12, 2) NOT NULL,
  performed_by TEXT NOT NULL,
  notes TEXT,
  supplier TEXT,
  warehouse TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Sales Orders / Invoices Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  area TEXT NOT NULL,
  party_category TEXT CHECK (party_category IN ('A', 'B', 'C')),
  salesperson TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount_total NUMERIC(12, 2) DEFAULT 0.00,
  tax_amount NUMERIC(12, 2) DEFAULT 0.00,
  grand_total NUMERIC(12, 2) NOT NULL,
  amount_paid NUMERIC(12, 2) DEFAULT 0.00,
  amount_remaining NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Posted' CHECK (status IN ('Draft', 'Pending', 'Confirmed', 'Delivered', 'Cancelled', 'Posted', 'Reversed')),
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Partially Paid', 'Unpaid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  category TEXT CHECK (category IN ('Confectionery', 'Cold Drinks')),
  batch TEXT,
  unit TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL
);

-- 14. Sales Returns Table
CREATE TABLE IF NOT EXISTS public.sales_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  unit TEXT NOT NULL,
  batch TEXT,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  refund_amount NUMERIC(12, 2) NOT NULL,
  is_resalable BOOLEAN DEFAULT TRUE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Client Financial Ledger Table
CREATE TABLE IF NOT EXISTS public.client_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC(12, 2) DEFAULT 0.00,
  credit NUMERIC(12, 2) DEFAULT 0.00,
  balance NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Customer Collections Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque', 'Other')),
  reference_number TEXT,
  allocated_invoice TEXT,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Distribution Daily Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque', 'Other')),
  paid_to TEXT NOT NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  receipt_reference TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Posted' CHECK (status IN ('Draft', 'Posted')),
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Bad Debts Write-off Table
CREATE TABLE IF NOT EXISTS public.bad_debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bad_debt_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  outstanding_amount NUMERIC(12, 2) NOT NULL,
  write_off_amount NUMERIC(12, 2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  approval_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Bad Debt Recoveries Table
CREATE TABLE IF NOT EXISTS public.bad_debt_recoveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recovery_number TEXT UNIQUE NOT NULL,
  bad_debt_id UUID REFERENCES public.bad_debts(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Daily Closings & Reconciliation Table
CREATE TABLE IF NOT EXISTS public.daily_closings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RECONCILIATION', 'CLOSED')),
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  reopened_at TIMESTAMPTZ,
  reopened_by TEXT,
  reopen_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_closing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  closing_id UUID REFERENCES public.daily_closings(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  opening_stock INT NOT NULL,
  purchases INT NOT NULL DEFAULT 0,
  sales_returns INT NOT NULL DEFAULT 0,
  other_increases INT NOT NULL DEFAULT 0,
  sales INT NOT NULL DEFAULT 0,
  purchase_returns INT NOT NULL DEFAULT 0,
  expired INT NOT NULL DEFAULT 0,
  damaged INT NOT NULL DEFAULT 0,
  other_decreases INT NOT NULL DEFAULT 0,
  expected_closing INT NOT NULL,
  physical_count INT NOT NULL,
  variance INT NOT NULL,
  reason TEXT
);

-- 21. Damaged Stock & Expiry Records
CREATE TABLE IF NOT EXISTS public.damaged_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  batch TEXT,
  quantity INT NOT NULL,
  unit TEXT NOT NULL,
  unit_cost NUMERIC(10, 2) NOT NULL,
  total_loss NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expiry_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  batch TEXT NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE NOT NULL,
  quantity INT NOT NULL,
  unit TEXT NOT NULL,
  purchase_cost NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Safe' CHECK (status IN ('Safe', 'Expiring Soon', 'Expired', 'Written Off', 'Returned to Supplier')),
  written_off_at TIMESTAMPTZ,
  reason TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_ref TEXT NOT NULL,
  details TEXT NOT NULL
);

-- 23. Receipt Logs Table
CREATE TABLE IF NOT EXISTS public.receipt_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('PRINTED', 'EMAILED')),
  email TEXT,
  sent_at TIMESTAMPTZ,
  sent_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bad_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bad_debt_recoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damaged_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expiry_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users access
CREATE POLICY "Authenticated users full access staff" ON public.staff_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access areas" ON public.areas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access clients" ON public.clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access suppliers" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access supplier_payments" ON public.supplier_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access purchases" ON public.purchases FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access purchase_items" ON public.purchase_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access purchase_returns" ON public.purchase_returns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access inventory" ON public.inventory_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access order_items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access sales_returns" ON public.sales_returns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access ledger" ON public.client_ledger FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access payments" ON public.payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access expenses" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access bad_debts" ON public.bad_debts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access recoveries" ON public.bad_debt_recoveries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access daily_closings" ON public.daily_closings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access daily_closing_items" ON public.daily_closing_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access damaged_stock" ON public.damaged_stock FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access expiry_records" ON public.expiry_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access audit" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access receipts" ON public.receipt_logs FOR ALL USING (auth.role() = 'authenticated');
