'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Truck, RotateCcw, Plus, AlertTriangle, Building, Package, CheckCircle } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { PurchaseReturn } from '@/types';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';

export default function PurchaseReturnsPage() {
  const { purchaseReturns, recordPurchaseReturn, purchases, suppliers, products } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Eligible purchases (posted and not yet returned)
  const eligiblePurchases = purchases.filter(p => p.status === 'Posted');

  const [formData, setFormData] = useState({
    purchaseId: eligiblePurchases[0]?.id || '',
    purchaseInvoiceNumber: eligiblePurchases[0]?.invoiceNumber || '',
    supplierId: eligiblePurchases[0]?.supplierId || suppliers[0]?.id || '',
    supplierName: eligiblePurchases[0]?.supplierName || suppliers[0]?.name || '',
    productId: eligiblePurchases[0]?.items[0]?.productId || products[0]?.id || '',
    productName: eligiblePurchases[0]?.items[0]?.productName || products[0]?.name || '',
    quantity: 1,
    unit: eligiblePurchases[0]?.items[0]?.unit || products[0]?.unit || 'Carton',
    batch: eligiblePurchases[0]?.items[0]?.batchNumber || products[0]?.batchNumber || 'BATCH-01',
    returnDate: getTodayKarachiDate(),
    refundAmount: eligiblePurchases[0]?.items[0]?.purchasePrice || products[0]?.costPrice || 2000,
    reason: 'Factory packaging defective / transit damage return to supplier',
  });

  const selectedPurchase = eligiblePurchases.find(p => p.id === formData.purchaseId);
  const availableItems = selectedPurchase?.items || [];

  const handleOpenAddModal = () => {
    const defaultPur = eligiblePurchases[0];
    const defaultItem = defaultPur?.items[0];
    const defaultProd = products.find(p => p.id === defaultItem?.productId) || products[0];

    setFormData({
      purchaseId: defaultPur?.id || '',
      purchaseInvoiceNumber: defaultPur?.invoiceNumber || 'PINV-5001',
      supplierId: defaultPur?.supplierId || suppliers[0]?.id || '',
      supplierName: defaultPur?.supplierName || suppliers[0]?.name || '',
      productId: defaultItem?.productId || defaultProd?.id || '',
      productName: defaultItem?.productName || defaultProd?.name || '',
      quantity: 1,
      unit: defaultItem?.unit || defaultProd?.unit || 'Carton',
      batch: defaultItem?.batchNumber || defaultProd?.batchNumber || 'BATCH-01',
      returnDate: getTodayKarachiDate(),
      refundAmount: defaultItem?.purchasePrice || defaultProd?.costPrice || 2400,
      reason: 'Factory packaging defective / transit damage return to supplier',
    });
    setIsModalOpen(true);
  };

  const handlePurchaseChange = (purchaseId: string) => {
    const pur = eligiblePurchases.find(p => p.id === purchaseId);
    if (!pur) return;
    const firstItem = pur.items[0];
    const prod = products.find(p => p.id === firstItem?.productId);

    setFormData(prev => ({
      ...prev,
      purchaseId: pur.id,
      purchaseInvoiceNumber: pur.invoiceNumber,
      supplierId: pur.supplierId,
      supplierName: pur.supplierName,
      productId: firstItem?.productId || prod?.id || prev.productId,
      productName: firstItem?.productName || prod?.name || prev.productName,
      unit: firstItem?.unit || prod?.unit || prev.unit,
      batch: firstItem?.batchNumber || prod?.batchNumber || prev.batch,
      refundAmount: (firstItem?.purchasePrice || prod?.costPrice || 2000) * prev.quantity,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPurchaseReturn(formData);
    const invNum = formData.purchaseInvoiceNumber;
    setIsModalOpen(false);
    setToastMessage(`Purchase return for #${invNum} recorded. Invoice is now automatically removed from Daily Purchases.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const columns: Column<PurchaseReturn>[] = [
    {
      header: 'Return #',
      accessorKey: 'returnNumber',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-900 block font-mono text-xs">{r.returnNumber}</span>
          <span className="text-[10px] text-slate-500 font-mono">Invoice: {r.purchaseInvoiceNumber}</span>
        </div>
      ),
    },
    {
      header: 'Supplier',
      cell: (r) => <span className="font-semibold text-slate-900 text-xs">{r.supplierName}</span>,
    },
    {
      header: 'Returned Product & Qty',
      cell: (r) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800 block">{r.productName}</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {r.quantity} {r.unit} • Batch: {r.batch || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Payable Refund (PKR)',
      cell: (r) => (
        <span className="font-bold font-mono text-xs text-rose-600">
          -{formatPKR(r.refundAmount)}
        </span>
      ),
    },
    {
      header: 'Return Reason',
      cell: (r) => <span className="text-xs text-slate-600 italic">{r.reason}</span>,
    },
    {
      header: 'Date',
      cell: (r) => <span className="text-xs font-mono text-slate-600">{formatDateDDMMYYYY(r.returnDate)}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
            <RotateCcw className="h-5 w-5 mr-2 text-rose-600" /> Purchase Returns to Suppliers
          </h1>
          <p className="text-xs text-slate-500">
            Deduct defective or expired consignment quantities from inventory and adjust factory payables. Returned purchases are automatically removed from Daily Purchases.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          disabled={eligiblePurchases.length === 0}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Record Purchase Return</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Truck className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            <strong>Automatic Removal Rule:</strong> When a purchase consignment is returned, it is automatically removed from active Daily Purchases and factory payables are reduced.
          </span>
        </div>
        <Link href="/purchases" className="text-xs font-bold text-blue-700 hover:underline shrink-0 ml-4">
          View Daily Purchases &rarr;
        </Link>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={purchaseReturns}
        searchPlaceholder="Search purchase return by supplier, invoice #, product..."
        searchField={(r) => `${r.returnNumber} ${r.purchaseInvoiceNumber} ${r.supplierName} ${r.productName} ${r.reason}`}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Supplier Purchase Return"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
            <p className="font-semibold flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1.5 text-amber-700" />
              Automated Daily Purchases Adjustment
            </p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Posting this return will deduct items from stock, decrease factory payable, and <strong>automatically remove this purchase from Daily Purchases</strong>.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Original Purchase Invoice *</label>
            {eligiblePurchases.length === 0 ? (
              <p className="p-2 bg-slate-100 rounded text-slate-500 italic">No posted purchases available to return.</p>
            ) : (
              <select
                value={formData.purchaseId}
                onChange={e => handlePurchaseChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                {eligiblePurchases.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.invoiceNumber} — {p.supplierName} ({formatDateDDMMYYYY(p.purchaseDate)}) • Total: {formatPKR(p.grandTotal)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product *</label>
              <select
                value={formData.productId}
                onChange={e => {
                  const it = availableItems.find(item => item.productId === e.target.value);
                  const p = products.find(prod => prod.id === e.target.value);
                  const unitCost = it?.purchasePrice || p?.costPrice || 2000;
                  setFormData({
                    ...formData,
                    productId: e.target.value,
                    productName: it?.productName || p?.name || '',
                    unit: it?.unit || p?.unit || 'Carton',
                    batch: it?.batchNumber || p?.batchNumber || 'BATCH-01',
                    refundAmount: unitCost * formData.quantity,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                {availableItems.length > 0 ? (
                  availableItems.map(it => (
                    <option key={it.productId} value={it.productId}>
                      {it.productName} ({it.quantity} {it.unit})
                    </option>
                  ))
                ) : (
                  products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity Returned *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={e => {
                  const qty = Math.max(1, Number(e.target.value));
                  const it = availableItems.find(item => item.productId === formData.productId);
                  const p = products.find(prod => prod.id === formData.productId);
                  const unitCost = it?.purchasePrice || p?.costPrice || 2000;
                  setFormData({
                    ...formData,
                    quantity: qty,
                    refundAmount: unitCost * qty,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payable Debit Refund (PKR) *</label>
              <input
                type="number"
                min="0"
                value={formData.refundAmount}
                onChange={e => setFormData({ ...formData, refundAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-rose-600"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch #</label>
              <input
                type="text"
                value={formData.batch}
                onChange={e => setFormData({ ...formData, batch: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Return Reason *</label>
            <input
              type="text"
              placeholder="e.g. Factory seal defective, leakage, or returnable consignment"
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-xs"
            >
              Post Return & Remove Purchase
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
