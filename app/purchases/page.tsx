'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Truck, Plus, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Purchase } from '@/types';
import { formatPKR, formatDateDDMMYYYY } from '@/lib/utils';

export default function PurchasesPage() {
  const { purchases, postPurchase, returnPurchase } = useAppState();
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Posted' | 'Draft' | 'Returned' | 'All'>('Active');
  const [returnModalPurchase, setReturnModalPurchase] = useState<Purchase | null>(null);
  const [returnReason, setReturnReason] = useState('Transit damage / defective shipment returned to supplier');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activePurchases = purchases.filter(p => p.status !== 'Returned' && p.status !== 'Cancelled');
  const returnedPurchases = purchases.filter(p => p.status === 'Returned');

  const filteredPurchases = purchases.filter(p => {
    if (selectedSupplierFilter !== 'All' && p.supplierName !== selectedSupplierFilter) return false;
    if (statusFilter === 'Active') return p.status !== 'Returned' && p.status !== 'Cancelled';
    if (statusFilter === 'Returned') return p.status === 'Returned';
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    return true;
  });

  const handleOpenReturnModal = (p: Purchase) => {
    setReturnModalPurchase(p);
    setReturnReason('Defective packaging / leakage return to supplier');
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalPurchase) return;

    try {
      returnPurchase(returnModalPurchase.id, { reason: returnReason });
      const invNum = returnModalPurchase.invoiceNumber;
      setReturnModalPurchase(null);
      setToastMessage(`Purchase #${invNum} returned to supplier and automatically removed from Daily Purchases.`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'Error processing purchase return');
    }
  };

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
              : p.status === 'Returned'
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
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
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition"
            >
              Post to Stock
            </button>
          )}

          {p.status === 'Posted' && (
            <button
              onClick={() => handleOpenReturnModal(p)}
              title="Return purchase consignment to supplier"
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded transition"
            >
              <RotateCcw className="h-3.5 w-3.5 text-rose-600" />
              <span>Return Purchase</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold hover:underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Truck className="h-5 w-5 mr-2 text-brand-600" /> Daily Purchases & Inward Shipments
          </h1>
          <p className="text-xs text-slate-500">
            Record supplier factory dispatches, incoming consignments, batches, and payables. Returned purchases are automatically removed from daily records.
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
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter Purchases:</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                statusFilter === 'Active' ? 'bg-brand-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Active Daily Purchases</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">
                {activePurchases.length}
              </span>
            </button>

            {(['Posted', 'Draft'] as const).map(st => (
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

            <button
              onClick={() => setStatusFilter('Returned')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                statusFilter === 'Returned' ? 'bg-purple-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Returned Purchases</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px] font-mono">
                {returnedPurchases.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                statusFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Records ({purchases.length})
            </button>
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

      {/* Return Purchase Modal */}
      <Modal
        isOpen={!!returnModalPurchase}
        onClose={() => setReturnModalPurchase(null)}
        title={returnModalPurchase ? `Return Purchase Invoice #${returnModalPurchase.invoiceNumber}` : 'Return Purchase'}
        maxWidth="max-w-lg"
      >
        {returnModalPurchase && (
          <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              <p className="font-bold flex items-center">
                <RotateCcw className="h-4 w-4 mr-1.5 text-amber-700" />
                Returning Purchase #{returnModalPurchase.invoiceNumber}
              </p>
              <p className="text-[11px] text-amber-800 mt-1">
                Supplier: <strong>{returnModalPurchase.supplierName}</strong> • Total Value:{' '}
                <strong>{formatPKR(returnModalPurchase.grandTotal)}</strong> • Product lines:{' '}
                <strong>{returnModalPurchase.items.length} SKUs</strong>
              </p>
              <p className="text-[11px] text-amber-700 mt-1 italic">
                This will deduct returned quantities from warehouse inventory, reduce supplier payable debt, and <strong>automatically remove this purchase from Daily Purchases</strong>.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Return to Supplier *</label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Factory seal defective, leakage on delivery, or expired consignment"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setReturnModalPurchase(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs flex items-center space-x-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Confirm & Remove from Daily Purchases</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
