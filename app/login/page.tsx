'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { BUSINESS_CONFIG } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppState();

  const [email, setEmail] = useState('ahmad.raza@ahmadtraders.pk');
  const [password, setPassword] = useState('AhmadTraders2026!');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Please enter a valid business email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      login(email, selectedRole);
      setIsLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  const setDemoUser = (demoEmail: string, role: string) => {
    setEmail(demoEmail);
    setPassword('AhmadTraders2026!');
    setSelectedRole(role);
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

        {/* Validation error display */}
        {error && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2"></span>
            {error}
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
                placeholder="name@ahmadtraders.pk"
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
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
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

        {/* Quick Demo Credentials Assistant */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 mr-1" /> Quick Role Presets:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setDemoUser('ahmad.raza@ahmadtraders.pk', 'Admin')}
              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium transition text-center"
            >
              Admin (Ahmad)
            </button>
            <button
              onClick={() => setDemoUser('tariq.m@ahmadtraders.pk', 'Manager')}
              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium transition text-center"
            >
              Manager (Tariq)
            </button>
            <button
              onClick={() => setDemoUser('hamza.sales@ahmadtraders.pk', 'Sales')}
              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium transition text-center"
            >
              Sales (Hamza)
            </button>
            <button
              onClick={() => setDemoUser('usman.accounts@ahmadtraders.pk', 'Accounts')}
              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium transition text-center"
            >
              Accounts (Usman)
            </button>
            <button
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
