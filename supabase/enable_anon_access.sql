-- =================================================================
-- Ahmad Traders ERP - Supabase Permissions & RLS Configuration
-- Location: Khuram Chowk, Tezab Mills Road, Faisalabad, Pakistan
-- =================================================================
-- Run this script in the Supabase SQL Editor if you want to allow
-- both 'authenticated' users and the browser 'anon' key to read and
-- write data to all ERP tables without permission errors.
-- =================================================================

-- 1. Enable Full Access for both authenticated and anon roles on all ERP tables:

DO $$ 
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'staff_profiles',
    'areas',
    'clients',
    'products',
    'suppliers',
    'supplier_payments',
    'purchases',
    'purchase_items',
    'purchase_returns',
    'inventory_transactions',
    'orders',
    'order_items',
    'sales_returns',
    'client_ledger',
    'payments',
    'expenses',
    'bad_debts',
    'bad_debt_recoveries',
    'daily_closings',
    'daily_closing_items',
    'damaged_stock',
    'expiry_records',
    'audit_logs',
    'receipt_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Drop existing restrictive authenticated-only policy if it exists
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users full access %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public full access %I" ON public.%I', tbl, tbl);
    
    -- Create policy allowing both authenticated and anon roles full access
    EXECUTE format('CREATE POLICY "Public full access %I" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true)', tbl, tbl);
    
    -- Ensure grants are present for anon and authenticated
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role', tbl);
  END LOOP;
END $$;

-- 2. Verify policies applied
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
