'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Check, X, Lock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

const PERMISSIONS_MATRIX = [
  { module: 'Dashboard & Analytics', admin: true, manager: true, sales: 'Limited', accounts: 'Limited', inventory: 'Limited' },
  { module: 'Client Directory (View & Add)', admin: true, manager: true, sales: true, accounts: true, inventory: false },
  { module: 'Client Financial Ledger & Payments', admin: true, manager: true, sales: false, accounts: true, inventory: false },
  { module: 'Inventory Products Catalog', admin: true, manager: true, sales: 'View', accounts: 'View', inventory: true },
  { module: 'Stock In / Receive Shipments', admin: true, manager: true, sales: false, accounts: false, inventory: true },
  { module: 'Stock Out & Adjustments', admin: true, manager: true, sales: false, accounts: false, inventory: true },
  { module: 'Wholesale Order Creation', admin: true, manager: true, sales: true, accounts: false, inventory: false },
  { module: 'Accounts Receivables', admin: true, manager: true, sales: false, accounts: true, inventory: false },
  { module: 'Staff & Team Management', admin: true, manager: false, sales: false, accounts: false, inventory: false },
  { module: 'System Reports & Export', admin: true, manager: true, sales: 'Sales Only', accounts: 'Financial Only', inventory: 'Stock Only' },
  { module: 'System Settings & Audit Trail', admin: true, manager: false, sales: false, accounts: false, inventory: false },
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
            <p className="text-xs text-slate-500">Security permissions matrix across system modules.</p>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-erp overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
            <ShieldCheck className="h-4 w-4 text-brand-600 mr-2" /> Module Access Rights Matrix
          </span>
          <span className="text-xs text-slate-500">5 Pre-configured System Roles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">System Module</th>
                <th className="py-3 px-4 text-center"><StatusBadge status="Admin" /></th>
                <th className="py-3 px-4 text-center"><StatusBadge status="Manager" /></th>
                <th className="py-3 px-4 text-center"><StatusBadge status="Sales" /></th>
                <th className="py-3 px-4 text-center"><StatusBadge status="Accounts" /></th>
                <th className="py-3 px-4 text-center"><StatusBadge status="Inventory" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSIONS_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.module}</td>
                  <td className="py-3 px-4 text-center">
                    <Check className="h-4 w-4 text-emerald-600 mx-auto font-bold" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.manager === true ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : row.manager === false ? (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    ) : (
                      <span className="text-[11px] font-medium text-amber-600">{row.manager}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.sales === true ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : row.sales === false ? (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    ) : (
                      <span className="text-[11px] font-medium text-amber-600">{row.sales}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.accounts === true ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : row.accounts === false ? (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    ) : (
                      <span className="text-[11px] font-medium text-amber-600">{row.accounts}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.inventory === true ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : row.inventory === false ? (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    ) : (
                      <span className="text-[11px] font-medium text-amber-600">{row.inventory}</span>
                    )}
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
