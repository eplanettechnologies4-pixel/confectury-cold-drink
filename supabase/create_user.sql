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
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR FOR YOUR NEW ADMIN USER:
-- Admin UUID: 00a1090c-43b2-41ae-83a9-7d3c2d4daaaf
-- =================================================================

-- 1. Ensure user metadata in auth.users has role 'Admin'
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_build_object(
    'name', COALESCE(raw_user_meta_data->>'name', 'Admin'),
    'role', 'Admin',
    'department', COALESCE(raw_user_meta_data->>'department', 'Executive Management'),
    'phone', COALESCE(raw_user_meta_data->>'phone', ''),
    'employee_id', 'EMP-001'
  ),
  updated_at = NOW()
WHERE id = '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf';

-- 2. Link & synchronize ERP profile in public.staff_profiles
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
  '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf',
  'EMP-001',
  (SELECT COALESCE(raw_user_meta_data->>'name', 'Admin') FROM auth.users WHERE id = '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf'),
  (SELECT email FROM auth.users WHERE id = '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf'),
  (SELECT COALESCE(raw_user_meta_data->>'phone', '') FROM auth.users WHERE id = '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf'),
  'Admin',
  'Executive Management',
  'Active'
)
ON CONFLICT (email) DO UPDATE SET
  user_id = '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf',
  role = 'Admin',
  status = 'Active',
  department = 'Executive Management',
  updated_at = NOW();

-- 3. Clean up any stale staff profiles (keep only the single Admin account)
DELETE FROM public.staff_profiles 
WHERE user_id != '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf' 
   OR user_id IS NULL;

-- =================================================================
-- VERIFY THE ADMIN USER IN SUPABASE:
-- =================================================================
SELECT 
  u.id AS auth_user_id, 
  u.email, 
  u.raw_user_meta_data->>'role' AS auth_role,
  sp.name AS profile_name, 
  sp.role AS profile_role, 
  sp.department, 
  sp.status,
  u.created_at 
FROM auth.users u
LEFT JOIN public.staff_profiles sp ON u.id = sp.user_id
WHERE u.id = '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf';
