'use client';

import React, { useState } from 'react';
import { Truck, RotateCcw, Plus, AlertTriangle, Building, Package } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { PurchaseReturn } from '@/types';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';

export default function PurchaseReturnsPage() {
  const { purchaseReturns, recordPurchaseReturn, purchases, suppliers, products } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    purchaseId: purchases[0]?.id || '',
    purchaseInvoiceNumber: purchases[0]?.invoiceNumber || '',
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    quantity: 5,
    unit: products[0]?.unit || 'Carton',
    batch: products[0]?.batchNumber || 'BATCH-01',
    returnDate: getTodayKarachiDate(),
    refundAmount: (products[0]?.costPrice || 2000) * 5,
    reason: 'Factory seal defective / leakage on delivery',
  });

  const handleOpenAddModal = () => {
    const defaultPur = purchases[0];
    const defaultItem = defaultPur?.items[0];
    const defaultProd = products.find(p => p.id === defaultItem?.productId) || products[0];

    setFormData({
      purchaseId: defaultPur?.id || '',
      purchaseInvoiceNumber: defaultPur?.invoiceNumber || 'PINV-5001',
      supplierId: defaultPur?.supplierId || suppliers[0]?.id || '',
      supplierName: defaultPur?.supplierName || suppliers[0]?.name || '',
      productId: defaultProd?.id || '',
      productName: defaultProd?.name || '',
      quantity: 5,
      unit: defaultProd?.unit || 'Carton',
      batch: defaultProd?.batchNumber || 'BATCH-01',
      returnDate: getTodayKarachiDate(),
      refundAmount: (defaultProd?.costPrice || 2400) * 5,
      reason: 'Factory packaging defective / transit damage return to supplier',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPurchaseReturn(formData);
    setIsModalOpen(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <RotateCcw className="h-5 w-5 mr-2 text-rose-600" /> Purchase Returns to Suppliers
          </h1>
          <p className="text-xs text-slate-500">
            Deduct defective or expired consignment quantities from inventory and adjust factory payables.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>Record Purchase Return</span>
        </button>
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
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Supplier *</label>
            <select
              value={formData.supplierId}
              onChange={e => {
                const s = suppliers.find(sup => sup.id === e.target.value);
                setFormData({
                  ...formData,
                  supplierId: e.target.value,
                  supplierName: s?.name || '',
                });
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product *</label>
              <select
                value={formData.productId}
                onChange={e => {
                  const p = products.find(prod => prod.id === e.target.value);
                  setFormData({
                    ...formData,
                    productId: e.target.value,
                    productName: p?.name || '',
                    unit: p?.unit || 'Carton',
                    refundAmount: (p?.costPrice || 2000) * formData.quantity,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
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
                  const p = products.find(prod => prod.id === formData.productId);
                  setFormData({
                    ...formData,
                    quantity: qty,
                    refundAmount: (p?.costPrice || 2000) * qty,
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
              Record Purchase Return
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
