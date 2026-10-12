-- ==============================================================================
-- AHMAD TRADERS ERP: Fix Foreign Key Constraints for Suppliers Deletion
-- Run this in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. purchases table: Drop restrictive constraint and add ON DELETE CASCADE
ALTER TABLE IF EXISTS public.purchases 
  DROP CONSTRAINT IF EXISTS purchases_supplier_id_fkey;

ALTER TABLE IF EXISTS public.purchases 
  ADD CONSTRAINT purchases_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- 2. supplier_payments table: Drop restrictive constraint and add ON DELETE CASCADE
ALTER TABLE IF EXISTS public.supplier_payments 
  DROP CONSTRAINT IF EXISTS supplier_payments_supplier_id_fkey;

ALTER TABLE IF EXISTS public.supplier_payments 
  ADD CONSTRAINT supplier_payments_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- 3. purchase_returns table: Drop restrictive constraints and add ON DELETE CASCADE
ALTER TABLE IF EXISTS public.purchase_returns 
  DROP CONSTRAINT IF EXISTS purchase_returns_supplier_id_fkey;

ALTER TABLE IF EXISTS public.purchase_returns 
  ADD CONSTRAINT purchase_returns_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.purchase_returns 
  DROP CONSTRAINT IF EXISTS purchase_returns_purchase_id_fkey;

ALTER TABLE IF EXISTS public.purchase_returns 
  ADD CONSTRAINT purchase_returns_purchase_id_fkey 
  FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;

-- 4. products table: Ensure supplier_id is set to NULL if supplier is deleted
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_supplier_id_fkey' 
    AND table_name = 'products'
  ) THEN
    ALTER TABLE public.products DROP CONSTRAINT products_supplier_id_fkey;
    ALTER TABLE public.products 
      ADD CONSTRAINT products_supplier_id_fkey 
      FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
  END IF;
END $$;
