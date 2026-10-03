'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Check, Lock, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

const PERMISSIONS_MATRIX = [
  { module: 'Dashboard & Business Analytics', admin: true, scope: 'Full Access across all revenues, profits & KPIs' },
  { module: 'Client Directory (Parties & Khata)', admin: true, scope: 'Full Add, Edit, Credit Limits & Statement view' },
  { module: 'Client Financial Ledger & Payments', admin: true, scope: 'Post collections, write-offs & reconcile balances' },
  { module: 'Inventory Products Catalog & Pricing', admin: true, scope: 'Full catalog control, wholesale & retail pricing' },
  { module: 'Stock In / Receive Shipments', admin: true, scope: 'Direct purchase posting, supplier returns & batches' },
  { module: 'Stock Out & Physical Adjustments', admin: true, scope: 'Reconcile discrepancies, damaged & expired stock' },
  { module: 'Wholesale Order Creation & Invoicing', admin: true, scope: 'Create, edit, approve and dispatch sales invoices' },
  { module: 'Accounts Receivables & Credit Recovery', admin: true, scope: 'Track aging, set recovery routes & collection schedules' },
  { module: 'Staff & Team Management', admin: true, scope: 'Admin user management & Supabase Auth integration' },
  { module: 'Financial Reports & P&L Export', admin: true, scope: 'Complete multi-format exports (PDF / Excel / Print)' },
  { module: 'System Settings & Audit Trail', admin: true, scope: 'Full system audit logs, database wipe & company parameters' },
];

export default function RolesPermissionsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/staff" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Role-Based Access Control (RBAC)</h1>
            <p className="text-xs text-slate-500">Security permissions & access privilege specifications.</p>
          </div>
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-600 mr-1.5" />
          Single Admin Role Mode Active
        </div>
      </div>

      {/* Policy Notice Card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs flex items-start space-x-3 shadow-lg">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-white">System Security Policy: Exclusive Admin Privilege</p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            All secondary user roles (Manager, Sales, Accounts, and Inventory) have been decommissioned. The ERP currently operates exclusively under the primary <strong className="text-emerald-400">Admin</strong> role with unrestricted access across all operational, financial, and warehouse modules.
          </p>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-erp overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
            <ShieldCheck className="h-4 w-4 text-emerald-600 mr-2" /> Module Access Rights Matrix
          </span>
          <span className="text-xs text-slate-500 font-medium">1 Active System Role (Admin)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">System Module</th>
                <th className="py-3 px-4 text-center w-36"><StatusBadge status="Admin" /></th>
                <th className="py-3 px-4">Operational Scope</th>
                <th className="py-3 px-4 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSIONS_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.module}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                      <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      <span>Full Access</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-[11px]">{row.scope}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Enabled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
