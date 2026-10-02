'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowDownRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { StockMovementType } from '@/types';

export default function StockOutPage() {
  const router = useRouter();
  const { products, recordStockMovement } = useAppState();

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [reason, setReason] = useState<StockMovementType>('Damaged');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find(p => p.id === productId);
  const currentStock = selectedProduct?.currentStock || 0;
  const remainingStock = Math.max(0, currentStock - quantity);
  const isNegativeAttempt = quantity > currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0 || isNegativeAttempt) return;

    recordStockMovement(
      productId,
      reason,
      -quantity, // negative for deduction
      `STK-OUT-${Math.floor(1000 + Math.random() * 9000)}`,
      notes || `Stock deduction for ${reason}`
    );

    router.push('/inventory/history');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/inventory" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Issue Stock Out</h1>
            <p className="text-xs text-slate-500">Record stock deduction for damaged, expired, or adjusted inventory.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-erp p-6 space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Product SKU</label>
          <select
            value={productId}
            onChange={e => setProductId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Available: {p.availableStock} / Total: {p.currentStock})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Deduction Reason</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value as StockMovementType)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
          >
            <option value="Damaged">Damaged Goods / Transit Breakage</option>
            <option value="Expired">Expired Stock</option>
            <option value="Internal Use">Internal Use / Quality Testing</option>
            <option value="Adjustment">Audit Stock Adjustment</option>
            <option value="Return">Supplier Return</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Stock</span>
            <span className="text-base font-bold text-slate-800">{currentStock}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Deduct Qty</span>
            <input
              type="number"
              min="1"
              max={currentStock}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-rose-600"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Remaining Stock</span>
            <span className={`text-base font-bold ${remainingStock === 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {remainingStock}
            </span>
          </div>
        </div>

        {isNegativeAttempt && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>Stock out quantity cannot exceed current available inventory ({currentStock}).</span>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Reason Description & Notes</label>
          <textarea
            rows={3}
            placeholder="Provide detail for audit compliance..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
          <Link href="/inventory" className="px-4 py-2 border border-slate-300 rounded-lg font-medium">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isNegativeAttempt}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            Confirm Stock Deduction
          </button>
        </div>
      </form>
    </div>
  );
}
