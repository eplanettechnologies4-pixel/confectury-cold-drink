'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, MapPin, Phone, Database, CheckCircle2 } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { BUSINESS_CONFIG } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    // Check if Supabase keys are configured in environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (
      supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      supabaseKey &&
      !supabaseKey.includes('placeholder')
    ) {
      setIsSupabaseConfigured(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@')) {
      setError('Please enter a valid business email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    // Save or clear remember-me preference
    if (rememberMe) {
      localStorage.setItem('ahmad_remember_session', 'true');
    } else {
      localStorage.removeItem('ahmad_remember_session');
    }

    try {
      if (isSupabaseConfigured) {
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          // Fetch linked profile from public.staff_profiles
          const { data: profile } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle();

          const userRole = (profile?.role || data.user.user_metadata?.role || selectedRole || 'Admin') as User['role'];
          const userName = profile?.name || data.user.user_metadata?.name || cleanEmail.split('@')[0].toUpperCase();

          const authenticatedUser: User = {
            id: profile?.id || data.user.id,
            name: userName,
            email: data.user.email || cleanEmail,
            role: userRole,
            department: profile?.department || data.user.user_metadata?.department || 'Management',
            avatarUrl: profile?.avatar_url,
          };

          login(authenticatedUser);
          setIsLoading(false);
          router.push('/dashboard');
          return;
        }
      }
    } catch (err: any) {
      console.warn('Supabase auth check encountered error, continuing to local ERP login:', err);
    }

    // Local ERP authentication fallback
    setTimeout(() => {
      login(cleanEmail, selectedRole);
      setIsLoading(false);
      router.push('/dashboard');
    }, 350);
  };

  const setDemoUser = (demoEmail: string, role: string) => {
    setEmail(demoEmail);
    setPassword('AhmadTraders2026!');
    setSelectedRole(role);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white mb-3 shadow-lg shadow-emerald-600/40">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">{BUSINESS_CONFIG.name}</h1>
          <p className="text-xs uppercase font-bold text-emerald-400 tracking-wider mt-0.5">
            {BUSINESS_CONFIG.subtitle}
          </p>
          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 mt-2">
            <MapPin className="h-3 w-3 text-emerald-400" />
            <span>Khuram Chowk, Tezab Mills Road, Faisalabad</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 mt-0.5">
            <Phone className="h-3 w-3 text-emerald-400" />
            <span>03057165320 / 03040402614</span>
          </div>
        </div>

        {/* Database Status Indicator */}
        <div className="mb-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
          <span className="flex items-center text-slate-400 font-medium">
            <Database className="h-3 w-3 text-emerald-400 mr-1.5" />
            Authentication Source:
          </span>
          {isSupabaseConfigured ? (
            <span className="flex items-center text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Supabase Cloud
            </span>
          ) : (
            <span className="flex items-center text-amber-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
              Direct ERP Mode
            </span>
          )}
        </div>

        {/* Validation error display */}
        {error && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Business Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ahmad.raza@ahmadtraders.pk"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center text-slate-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-600 mr-2"
              />
              Remember session
            </label>
            <span className="text-emerald-400 font-medium">Asia/Karachi (PKR)</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to Ahmad Traders ERP</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Presets */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 mr-1" /> Quick Role Presets (Click to autofill):
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setDemoUser('ahmad.raza@ahmadtraders.pk', 'Admin')}
              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium transition text-center"
            >
              Admin (Ahmad)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('tariq.m@ahmadtraders.pk', 'Manager')}
              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium transition text-center"
            >
              Manager (Tariq)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('hamza.sales@ahmadtraders.pk', 'Sales')}
              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium transition text-center"
            >
              Sales (Hamza)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('usman.accounts@ahmadtraders.pk', 'Accounts')}
              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium transition text-center"
            >
              Accounts (Usman)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('bilal.wh@ahmadtraders.pk', 'Inventory')}
              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium transition text-center"
            >
              Inventory (Bilal)
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center">
        © 2026 Ahmad Traders — Confectionery & Cold Drinks Distribution ERP. Khuram Chowk, Faisalabad.
      </p>
    </div>
  );
}
