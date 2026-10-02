'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Truck, Plus, Eye, CheckCircle, Clock, XCircle, Search, Filter, Calendar } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Purchase } from '@/types';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate, BUSINESS_CONFIG } from '@/lib/utils';

export default function PurchasesPage() {
  const { purchases, postPurchase, isDateClosed } = useAppState();
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Posted' | 'Draft'>('All');

  const filteredPurchases = purchases.filter(p => {
    if (selectedSupplierFilter !== 'All' && p.supplierName !== selectedSupplierFilter) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    return true;
  });

  const columns: Column<Purchase>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      cell: (p) => (
        <div>
          <span className="font-bold text-slate-900 block font-mono text-xs">{p.invoiceNumber}</span>
          <span className="text-[10px] text-slate-500 font-mono">{formatDateDDMMYYYY(p.purchaseDate)}</span>
        </div>
      ),
    },
    {
      header: 'Supplier',
      accessorKey: 'supplierName',
      cell: (p) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{p.supplierName}</span>
          <span className="text-[10px] text-slate-500">{p.items.length} product lines</span>
        </div>
      ),
    },
    {
      header: 'Total Amount',
      cell: (p) => (
        <span className="font-bold font-mono text-xs text-slate-900">
          {formatPKR(p.grandTotal)}
        </span>
      ),
    },
    {
      header: 'Paid Amount',
      cell: (p) => (
        <span className="font-mono text-xs text-emerald-700 font-semibold">
          {formatPKR(p.amountPaid)}
        </span>
      ),
    },
    {
      header: 'Payable Balance',
      cell: (p) => (
        <span className={`font-bold font-mono text-xs ${p.remainingPayable > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
          {formatPKR(p.remainingPayable)}
        </span>
      ),
    },
    {
      header: 'Payment Type',
      cell: (p) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
          {p.paymentMethod}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (p) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            p.status === 'Posted'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : p.status === 'Draft'
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {p.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end space-x-2">
          {p.status === 'Draft' && (
            <button
              onClick={() => {
                if (confirm(`Post purchase #${p.invoiceNumber} to stock? This will increase inventory balances.`)) {
                  try {
                    postPurchase(p.id);
                  } catch (err: any) {
                    alert(err.message);
                  }
                }
              }}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition"
            >
              Post to Stock
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Truck className="h-5 w-5 mr-2 text-brand-600" /> Daily Purchases & Inward Shipments
          </h1>
          <p className="text-xs text-slate-500">
            Record supplier factory dispatches, incoming confectionery & beverage consignments, batches, and payables.
          </p>
        </div>

        <Link
          href="/purchases/new"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Purchase Invoice</span>
        </Link>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp flex flex-wrap items-center gap-4 text-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter by Status:</label>
          <div className="flex space-x-1">
            {(['All', 'Posted', 'Draft'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto text-xs font-mono text-slate-500 self-end pb-1">
          Showing <span className="font-bold text-slate-900">{filteredPurchases.length}</span> invoices
        </div>
      </div>

      {/* Purchases Data Table */}
      <DataTable
        columns={columns}
        data={filteredPurchases}
        searchPlaceholder="Search purchase by invoice #, supplier name..."
        searchField={(p) => `${p.invoiceNumber} ${p.supplierName} ${p.status}`}
      />
    </div>
  );
}
