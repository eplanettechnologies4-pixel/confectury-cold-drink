-- =================================================================
-- AHMAD TRADERS ERP - SUPABASE USER CREATION & MANAGEMENT SCRIPT
-- Location: Khuram Chowk, Tezab Mills Road, Faisalabad, Pakistan
-- =================================================================
-- This script allows you to create authenticated users in Supabase.
-- It automatically adds the user to `auth.users`, creates `auth.identities`
-- (so email/password login works), and creates their ERP profile in `public.staff_profiles`.
-- =================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Verify or recreate the user creation helper function
CREATE OR REPLACE FUNCTION public.create_erp_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'Admin',
  p_department TEXT DEFAULT 'Management',
  p_phone TEXT DEFAULT ''
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_encrypted_pw TEXT;
  v_emp_id TEXT;
BEGIN
  p_email := LOWER(TRIM(p_email));

  -- If user already exists in auth.users, update password & metadata
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_pw,
      raw_user_meta_data = json_build_object(
        'name', p_name,
        'role', p_role,
        'department', p_department,
        'phone', p_phone
      ),
      updated_at = NOW()
    WHERE email = p_email
    RETURNING id INTO v_user_id;

    -- Ensure auth.identities has valid provider_id
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
      INSERT INTO auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id::text,
        v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id::text, p_email)::jsonb,
        'email',
        NOW(),
        NOW(),
        NOW()
      );
    ELSE
      UPDATE auth.identities
      SET 
        provider_id = v_user_id::text,
        identity_data = format('{"sub":"%s","email":"%s"}', v_user_id::text, p_email)::jsonb,
        updated_at = NOW()
      WHERE user_id = v_user_id AND provider = 'email';
    END IF;

    -- Update or create staff profile
    INSERT INTO public.staff_profiles (
      user_id,
      employee_id,
      name,
      email,
      phone,
      role,
      department,
      status
    ) VALUES (
      v_user_id,
      'AT-' || TO_CHAR(NOW(), 'YY') || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0'),
      p_name,
      p_email,
      p_phone,
      p_role,
      p_department,
      'Active'
    )
    ON CONFLICT (email) DO UPDATE SET
      user_id = v_user_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      department = EXCLUDED.department,
      phone = EXCLUDED.phone,
      status = 'Active',
      updated_at = NOW();

    RETURN v_user_id;
  END IF;

  v_encrypted_pw := crypt(p_password, gen_salt('bf'));
  v_emp_id := 'AT-' || TO_CHAR(NOW(), 'YY') || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

  -- 1. Insert into Supabase Auth
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_pw,
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object(
      'name', p_name,
      'role', p_role,
      'department', p_department,
      'phone', p_phone,
      'employee_id', v_emp_id
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- 2. Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id::text,
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id::text, p_email)::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- 3. Insert into public.staff_profiles
  INSERT INTO public.staff_profiles (
    user_id,
    employee_id,
    name,
    email,
    phone,
    role,
    department,
    status
  ) VALUES (
    v_user_id,
    v_emp_id,
    p_name,
    p_email,
    p_phone,
    p_role,
    p_department,
    'Active'
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = v_user_id,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    phone = EXCLUDED.phone,
    status = 'Active';

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =================================================================
-- RUN ANY OF THE FOLLOWING STATEMENTS IN SUPABASE SQL EDITOR:
-- =================================================================

-- 1. Create Main Admin User (Ahmad Raza)
SELECT public.create_erp_user(
  'ahmad.raza@ahmadtraders.pk',
  'AhmadTraders2026!',
  'Ahmad Raza',
  'Admin',
  'Executive Management',
  '03057165320'
);

-- 2. Create Branch Manager User (Tariq Mahmood)
SELECT public.create_erp_user(
  'tariq.m@ahmadtraders.pk',
  'AhmadTraders2026!',
  'Tariq Mahmood',
  'Manager',
  'Operations',
  '03040402614'
);

-- 3. Create Sales Officer User (Hamza Malik)
SELECT public.create_erp_user(
  'hamza.sales@ahmadtraders.pk',
  'AhmadTraders2026!',
  'Hamza Malik',
  'Sales',
  'Sales & Distribution',
  '03001234567'
);

-- 4. Create Accounts Officer User (Usman Ghani)
SELECT public.create_erp_user(
  'usman.accounts@ahmadtraders.pk',
  'AhmadTraders2026!',
  'Usman Ghani',
  'Accounts',
  'Finance & Recovery',
  '03217654321'
);

-- 5. Create Warehouse/Inventory Manager (Bilal Ahmed)
SELECT public.create_erp_user(
  'bilal.wh@ahmadtraders.pk',
  'AhmadTraders2026!',
  'Bilal Ahmed',
  'Inventory',
  'Warehouse & Logistics',
  '03339876543'
);

-- =================================================================
-- TEMPLATE FOR CREATING YOUR OWN CUSTOM USER:
-- (Change the email, password, name, role, department, and phone below)
-- =================================================================
/*
SELECT public.create_erp_user(
  'your.email@ahmadtraders.pk', -- Email address
  'YourSecurePassword123!',     -- Password (min 6 characters)
  'Your Full Name',             -- Name
  'Admin',                      -- Role: 'Admin', 'Manager', 'Sales', 'Accounts', 'Inventory', or 'Staff'
  'Management',                 -- Department
  '03000000000'                 -- Phone number
);
*/

-- =================================================================
-- CHECK ALL CREATED USERS:
-- =================================================================
SELECT 
  u.id, 
  u.email, 
  sp.name, 
  sp.role, 
  sp.department, 
  sp.phone, 
  sp.status,
  u.created_at 
FROM auth.users u
LEFT JOIN public.staff_profiles sp ON u.id = sp.user_id;
