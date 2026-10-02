'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Plus, ShoppingBag, Eye, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SalesReturn } from '@/types';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';

export default function SalesReturnsPage() {
  const { salesReturns, recordSalesReturn, orders, clients, products } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    orderId: orders[0]?.id || '',
    orderNumber: orders[0]?.orderNumber || '',
    clientId: orders[0]?.clientId || clients[0]?.id || '',
    clientName: orders[0]?.companyName || clients[0]?.companyName || '',
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    quantity: 1,
    unit: products[0]?.unit || 'Carton',
    batch: products[0]?.batchNumber || 'BATCH-01',
    returnDate: getTodayKarachiDate(),
    refundAmount: products[0]?.sellingPrice || 0,
    isResalable: true,
    reason: 'Customer overstocked / excess quantity',
  });

  const handleOpenAddModal = () => {
    const defaultOrder = orders[0];
    const defaultItem = defaultOrder?.items[0];
    const defaultProd = products.find(p => p.id === defaultItem?.productId) || products[0];

    setFormData({
      orderId: defaultOrder?.id || '',
      orderNumber: defaultOrder?.orderNumber || 'INV-8801',
      clientId: defaultOrder?.clientId || clients[0]?.id || '',
      clientName: defaultOrder?.companyName || clients[0]?.companyName || '',
      productId: defaultProd?.id || '',
      productName: defaultProd?.name || '',
      quantity: 1,
      unit: defaultProd?.unit || 'Carton',
      batch: defaultProd?.batchNumber || 'BATCH-01',
      returnDate: getTodayKarachiDate(),
      refundAmount: defaultProd?.sellingPrice || 2400,
      isResalable: true,
      reason: 'Excess stock return from route',
    });
    setIsModalOpen(true);
  };

  const handleOrderChange = (orderId: string) => {
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;
    const firstItem = ord.items[0];
    const prod = products.find(p => p.id === firstItem?.productId);

    setFormData(prev => ({
      ...prev,
      orderId: ord.id,
      orderNumber: ord.orderNumber,
      clientId: ord.clientId,
      clientName: ord.companyName,
      productId: firstItem?.productId || prev.productId,
      productName: firstItem?.productName || prev.productName,
      unit: firstItem?.unit || prev.unit,
      batch: firstItem?.batch || prev.batch,
      refundAmount: (firstItem?.unitPrice || 2000) * prev.quantity,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordSalesReturn(formData);
    setIsModalOpen(false);
  };

  const columns: Column<SalesReturn>[] = [
    {
      header: 'Return #',
      accessorKey: 'returnNumber',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-900 block font-mono text-xs">{r.returnNumber}</span>
          <span className="text-[10px] text-slate-500 font-mono">Invoice: {r.orderNumber}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (r) => <span className="font-semibold text-slate-900 text-xs">{r.clientName}</span>,
    },
    {
      header: 'Product & Qty',
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
      header: 'Condition / Stock',
      cell: (r) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            r.isResalable
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}
        >
          {r.isResalable ? 'Resalable (Added to Stock)' : 'Damaged (Added to Loss)'}
        </span>
      ),
    },
    {
      header: 'Credit Refund',
      cell: (r) => (
        <span className="font-bold font-mono text-xs text-rose-600">
          -{formatPKR(r.refundAmount)}
        </span>
      ),
    },
    {
      header: 'Reason',
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
            <RotateCcw className="h-5 w-5 mr-2 text-rose-600" /> Customer Sales Returns
          </h1>
          <p className="text-xs text-slate-500">
            Process returned confectionery and beverages with accurate stock restocking or damaged loss write-offs.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>Record Sales Return</span>
        </button>
      </div>

      {/* Returns Data Table */}
      <DataTable
        columns={columns}
        data={salesReturns}
        searchPlaceholder="Search sales return by customer, invoice #, product..."
        searchField={(r) => `${r.returnNumber} ${r.orderNumber} ${r.clientName} ${r.productName} ${r.reason}`}
      />

      {/* Record Return Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Sales Return"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Original Sales Invoice *</label>
            <select
              value={formData.orderId}
              onChange={e => handleOrderChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.companyName} ({formatDateDDMMYYYY(o.orderDate)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Returned Product *</label>
              <select
                value={formData.productId}
                onChange={e => {
                  const p = products.find(prod => prod.id === e.target.value);
                  setFormData({
                    ...formData,
                    productId: e.target.value,
                    productName: p?.name || '',
                    unit: p?.unit || 'Carton',
                    refundAmount: (p?.sellingPrice || 2000) * formData.quantity,
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
              <label className="block font-semibold text-slate-700 mb-1">Returned Quantity *</label>
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
                    refundAmount: (p?.sellingPrice || 2000) * qty,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stock Condition *</label>
              <select
                value={formData.isResalable ? 'true' : 'false'}
                onChange={e => setFormData({ ...formData, isResalable: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              >
                <option value="true">Saleable (Add back to Active Stock)</option>
                <option value="false">Damaged / Broken (Record in Damage Loss)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Refund / Credit Amount (PKR) *</label>
              <input
                type="number"
                min="0"
                value={formData.refundAmount}
                onChange={e => setFormData({ ...formData, refundAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-rose-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Return Reason / Notes *</label>
            <input
              type="text"
              placeholder="e.g. Overstocked, damaged packaging, or exchange"
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
              Post Sales Return
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
