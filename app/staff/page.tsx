'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Database,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
  Terminal,
  Server,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Staff, StaffRole } from '@/types';

export default function StaffPage() {
  const { staff, addStaff } = useAppState();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Local Staff Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Admin' as StaffRole,
    department: 'Executive Management',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Supabase User Creation Form Data
  const [supabaseUser, setSupabaseUser] = useState({
    name: 'Ahmad Raza',
    email: 'ahmad.raza@ahmadtraders.pk',
    password: 'AhmadTraders2026!',
    role: 'Admin' as StaffRole,
    department: 'Executive Management',
    phone: '03057165320',
  });

  const [activeSupabaseTab, setActiveSupabaseTab] = useState<'sql' | 'api' | 'guide'>('sql');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const columns: Column<Staff>[] = [
    {
      header: 'Employee ID / Name',
      cell: (s) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
            {s.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{s.name}</span>
            <span className="font-mono text-[10px] text-slate-500">{s.employeeId}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Role Access',
      cell: (s) => <StatusBadge status={s.role} />,
    },
    {
      header: 'Department',
      cell: (s) => <span className="text-xs font-medium text-slate-700">{s.department}</span>,
    },
    {
      header: 'Contact Info',
      cell: (s) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-700">{s.email}</div>
          <div className="text-slate-400 text-[11px]">{s.phone}</div>
        </div>
      ),
    },
    {
      header: 'Joining Date',
      cell: (s) => <span className="text-xs text-slate-600">{s.joiningDate}</span>,
    },
    {
      header: 'Status',
      cell: (s) => <StatusBadge status={s.status} />,
    },
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStaff(formData);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Admin',
      department: 'Executive Management',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    });
  };

  const [includeFullScript, setIncludeFullScript] = useState(true);

  // Generate dynamic SQL statement based on form state
  const cleanEmail = supabaseUser.email.trim().toLowerCase();
  const cleanName = supabaseUser.name.trim();
  const cleanDept = supabaseUser.department.trim();
  const cleanPhone = supabaseUser.phone.trim();
  const cleanPw = supabaseUser.password;
  const cleanRole = supabaseUser.role;

  const shortQuery = `-- Ahmad Traders ERP - Create User in Supabase
SELECT public.create_erp_user(
  '${cleanEmail}',
  '${cleanPw}',
  '${cleanName}',
  '${cleanRole}',
  '${cleanDept}',
  '${cleanPhone}'
);`;

  const fullScript = `-- =================================================================
-- AHMAD TRADERS ERP - COMPLETE SUPABASE USER CREATION SCRIPT
-- (Includes fix for provider_id constraint and auto profile creation)
-- =================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Define or update create_erp_user function
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

  -- 1. Insert into auth.users
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

  -- 2. Insert into auth.identities with provider_id
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

-- 3. Run User Creation
SELECT public.create_erp_user(
  '${cleanEmail}',
  '${cleanPw}',
  '${cleanName}',
  '${cleanRole}',
  '${cleanDept}',
  '${cleanPhone}'
);`;

  const generatedSql = includeFullScript ? fullScript : shortQuery;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleApiCreate = async () => {
    setIsApiLoading(true);
    setApiResult(null);

    try {
      const res = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supabaseUser),
      });

      const data = await res.json();
      setApiResult({
        success: data.success,
        message: data.message || (data.success ? 'User created successfully in Supabase!' : 'Failed to create user'),
      });

      if (data.success) {
        // Also add to local staff list if not already present
        const exists = staff.some((s) => s.email.toLowerCase() === supabaseUser.email.toLowerCase());
        if (!exists) {
          addStaff({
            name: supabaseUser.name,
            email: supabaseUser.email,
            phone: supabaseUser.phone,
            role: supabaseUser.role,
            department: supabaseUser.department,
            joiningDate: new Date().toISOString().split('T')[0],
            status: 'Active',
          });
        }
      }
    } catch (err: any) {
      setApiResult({
        success: false,
        message: err.message || 'Error communicating with Supabase API',
      });
    } finally {
      setIsApiLoading(false);
    }
  };

  const applyPreset = (preset: {
    name: string;
    email: string;
    role: StaffRole;
    department: string;
    phone: string;
  }) => {
    setSupabaseUser({
      ...preset,
      password: 'AhmadTraders2026!',
    });
    setApiResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff & Team Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage company employees, system access roles, and Supabase database user accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/staff/roles"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <ShieldCheck className="h-4 w-4 text-slate-600" />
            <span>Roles & Permissions</span>
          </Link>
          <button
            onClick={() => {
              setApiResult(null);
              setIsSupabaseModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Database className="h-4 w-4" />
            <span>Create User in Supabase</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Staff Members</span>
          <span className="text-2xl font-extrabold text-slate-900">{staff.length} Active</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active System Role</span>
          <span className="text-2xl font-extrabold text-purple-600">Admin Only</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Access Permissions</span>
          <span className="text-2xl font-extrabold text-emerald-600">Full System</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Admin Account</span>
          <span className="text-base font-extrabold text-slate-800 truncate block mt-1">Ahmad Raza</span>
        </div>
      </div>

      {/* Staff Table */}
      <DataTable
        columns={columns}
        data={staff}
        searchPlaceholder="Search staff by name, email, or role..."
        searchField={(s) => `${s.name} ${s.email} ${s.role} ${s.department}`}
        onAddClick={() => setIsAddModalOpen(true)}
        addLabel="Add Staff"
      />

      {/* ================================================================= */}
      {/* SUPABASE USER CREATION MODAL */}
      {/* ================================================================= */}
      <Modal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        title="Create User in Supabase"
        subtitle="Create authenticated login credentials in Supabase Auth & link to ERP Staff Profile"
      >
        <div className="space-y-4 text-xs">
          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center">
              <Sparkles className="h-3 w-3 text-emerald-600 mr-1" />
              Quick Fill Preset:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    name: 'Ahmad Raza',
                    email: 'ahmad.raza@ahmadtraders.pk',
                    role: 'Admin',
                    department: 'Executive Management',
                    phone: '03057165320',
                  })
                }
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded text-[11px] font-semibold text-emerald-800 transition flex items-center space-x-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Admin (Ahmad Raza)</span>
              </button>
            </div>
          </div>

          {/* User Fields Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={supabaseUser.name}
                onChange={(e) => setSupabaseUser({ ...supabaseUser, name: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Ahmad Raza"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email (Supabase Login)</label>
              <input
                type="email"
                value={supabaseUser.email}
                onChange={(e) => setSupabaseUser({ ...supabaseUser, email: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="user@ahmadtraders.pk"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="text"
                value={supabaseUser.password}
                onChange={(e) => setSupabaseUser({ ...supabaseUser, password: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                placeholder="Password (min 6 characters)"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">System Role</label>
              <select
                value={supabaseUser.role}
                onChange={(e) => setSupabaseUser({ ...supabaseUser, role: e.target.value as StaffRole })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Admin">Admin (Full Control)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={supabaseUser.department}
                onChange={(e) => setSupabaseUser({ ...supabaseUser, department: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Management"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number (Pakistan)</label>
              <input
                type="text"
                value={supabaseUser.phone}
                onChange={(e) => setSupabaseUser({ ...supabaseUser, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="03057165320"
              />
            </div>
          </div>

          {/* Method Selection Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSupabaseTab('sql')}
              className={`flex items-center space-x-1 px-3 py-2 font-semibold border-b-2 transition ${
                activeSupabaseTab === 'sql'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Method 1: SQL Editor (Recommended)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSupabaseTab('api')}
              className={`flex items-center space-x-1 px-3 py-2 font-semibold border-b-2 transition ${
                activeSupabaseTab === 'api'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>Method 2: One-Click API</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSupabaseTab('guide')}
              className={`flex items-center space-x-1 px-3 py-2 font-semibold border-b-2 transition ${
                activeSupabaseTab === 'guide'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Method 3: Supabase Dashboard</span>
            </button>
          </div>

          {/* TAB 1: SQL Query Generator */}
          {activeSupabaseTab === 'sql' && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center space-x-1.5 text-[11px] text-slate-700 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeFullScript}
                    onChange={(e) => setIncludeFullScript(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Include complete function &amp; provider_id fix (Recommended)</span>
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedSql)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition"
                >
                  {copiedSql ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Query'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                {generatedSql}
              </pre>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px] space-y-1">
                <p className="font-semibold flex items-center">
                  <Terminal className="h-3 w-3 mr-1 text-blue-600" /> How to run this in 3 easy clicks:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
                  <li>Open your <strong>Supabase Dashboard</strong> and click <strong>SQL Editor</strong> on the left.</li>
                  <li>Click <strong>New query</strong>, paste the code above, and click <strong>Run</strong> (Ctrl+Enter).</li>
                  <li>The user is created in both <code>auth.users</code> and <code>public.staff_profiles</code> instantly!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: Direct API Call */}
          {activeSupabaseTab === 'api' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-600">
                You can create this user directly through the Next.js API route if you have set{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>{' '}
                in your <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">.env.local</code>.
              </p>

              {apiResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center ${
                    apiResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {apiResult.success ? (
                    <Check className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2 text-amber-600 shrink-0" />
                  )}
                  <span>{apiResult.message}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isApiLoading}
                onClick={handleApiCreate}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 transition"
              >
                {isApiLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Server className="h-4 w-4" />
                    <span>Create User via Supabase API Now</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: Dashboard Walkthrough */}
          {activeSupabaseTab === 'guide' && (
            <div className="space-y-2.5 text-slate-700 text-[11px]">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <p className="font-semibold text-slate-900">Creating users via Supabase Web Studio:</p>
                <div className="space-y-1 text-slate-600">
                  <p>1. Go to <strong>Authentication</strong> &rarr; <strong>Users</strong> in your Supabase project.</p>
                  <p>2. Click <strong>Add user</strong> &rarr; <strong>Create user</strong>.</p>
                  <p>3. Enter the email and password.</p>
                  <p>4. In <strong>User Metadata</strong> (JSON), optionally add:</p>
                  <pre className="bg-slate-900 text-emerald-300 p-2 rounded text-[10px] font-mono">
{`{
  "name": "${supabaseUser.name}",
  "role": "${supabaseUser.role}",
  "department": "${supabaseUser.department}",
  "phone": "${supabaseUser.phone}"
}`}
                  </pre>
                  <p className="text-[10px] text-emerald-700">
                    * The database trigger <code>on_auth_user_created</code> in <code>schema.sql</code> will automatically sync this user into <code>public.staff_profiles</code>!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(false)}
              className="px-4 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ================================================================= */}
      {/* LOCAL ADD STAFF MODAL */}
      {/* ================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Member"
        subtitle="Create a new employee profile in Ahmad Traders ERP"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Muhammad Imran"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="imran@ahmadtraders.pk"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="03001234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">System Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="Admin">Admin (Full Control)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              Add Staff Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
