'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
  Plus,
  Trash2,
  Calendar,
  Save,
  CheckCircle,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { PurchaseItem, ProductCategory } from '@/types';
import { formatPKR, getTodayKarachiDate, formatDateDDMMYYYY } from '@/lib/utils';

interface RawPurchaseItem {
  productId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  discount: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const { suppliers, products, createPurchase, postPurchase, isDateClosed } = useAppState();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayKarachiDate());
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit' | 'Partial'>('Credit');
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  const [items, setItems] = useState<RawPurchaseItem[]>(() => {
    if (products.length === 0) return [];
    return [
      {
        productId: products[0]?.id || '',
        batchNumber: `BATCH-${new Date().getFullYear()}-01`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quantity: 20,
        purchasePrice: products[0]?.costPrice || 0,
        discount: 0,
      },
    ];
  });

  const handleAddItem = () => {
    const firstProd = products[0];
    if (firstProd) {
      setItems(prev => [
        ...prev,
        {
          productId: firstProd.id,
          batchNumber: `BATCH-${new Date().getFullYear()}-0${prev.length + 1}`,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          quantity: 20,
          purchasePrice: firstProd.costPrice,
          discount: 0,
        },
      ]);
    }
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const copy = [...items];
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      copy[idx] = {
        ...copy[idx],
        productId: val,
        purchasePrice: prod?.costPrice || 0,
      };
    } else {
      copy[idx] = { ...copy[idx], [field]: val };
    }
    setItems(copy);
  };

  // Line calculations
  const calculatedItems: PurchaseItem[] = items.map((item, idx) => {
    const prod = products.find(p => p.id === item.productId);
    const gross = item.quantity * item.purchasePrice;
    const lineTotal = Math.max(0, gross - item.discount);

    return {
      id: 'pitem-' + idx,
      productId: item.productId,
      productName: prod?.name || 'Selected Product',
      sku: prod?.sku || 'SKU-000',
      category: prod?.category || 'Cold Drinks',
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      unit: prod?.unit || 'Carton',
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      discount: item.discount,
      lineTotal,
    };
  });

  const subtotal = calculatedItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalDiscount = calculatedItems.reduce((sum, i) => sum + i.discount, 0);
  const grandTotal = subtotal + additionalCharges;
  const remainingPayable = Math.max(0, grandTotal - amountPaidNow);

  const handleSavePurchase = (status: 'Draft' | 'Posted') => {
    setErrorMessage('');
    if (!selectedSupplier) {
      setErrorMessage('Please select a supplier.');
      return;
    }
    if (calculatedItems.length === 0) {
      setErrorMessage('Please add at least one product line.');
      return;
    }
    if (isDateClosed(purchaseDate)) {
      setErrorMessage(`Business day ${formatDateDDMMYYYY(purchaseDate)} is CLOSED. Cannot record purchases for closed days.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const created = createPurchase({
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        purchaseDate,
        items: calculatedItems,
        subtotal,
        discount: totalDiscount,
        additionalCharges,
        grandTotal,
        amountPaid: amountPaidNow,
        remainingPayable,
        paymentMethod,
        status,
        notes: purchaseNotes,
      });

      setIsSubmitting(false);
      router.push('/purchases');
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to record purchase.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/purchases" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record Supplier Purchase Consignment</h1>
            <p className="text-xs text-slate-500">Multi-product factory purchase invoice with batch & expiry tracking</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleSavePurchase('Draft')}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-50"
          >
            Save Draft (No Stock Change)
          </button>
          <button
            type="button"
            onClick={() => handleSavePurchase('Posted')}
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <Truck className="h-4 w-4" />
            <span>Post & Increase Inventory</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {/* Empty State Banner */}
      {products.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span><strong>Product Catalog is Empty:</strong> You must add confectionery or cold drinks products first before recording purchase receipts.</span>
          </div>
          <Link href="/inventory/products" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0">
            + Add Products
          </Link>
        </div>
      )}

      {/* Section 1: Supplier & Date */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-erp p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
          <Building className="h-4 w-4 mr-2 text-brand-600" /> 1. Supplier & Consignment Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supplier Company *</label>
            <select
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.supplierId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Consignment Date *</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              <option value="Credit">Credit Consignment (Add to Payable)</option>
              <option value="Cash">Cash on Delivery</option>
              <option value="Partial">Partial Cash & Credit</option>
            </select>
          </div>
        </div>

        {selectedSupplier && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-500">Contact:</span> <span className="font-semibold text-slate-800">{selectedSupplier.contactPerson} ({selectedSupplier.phone})</span>
            </div>
            <div>
              <span className="text-slate-500">Current Payable to Supplier:</span>{' '}
              <span className="font-bold font-mono text-rose-600">{formatPKR(selectedSupplier.currentPayable)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Products Lines */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-erp p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            2. Received Items, Batches & Expiry Dates
          </h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item Line</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Batch #</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3 text-center">Unit</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Purchase Price (PKR)</th>
                <th className="py-2.5 px-3 text-right">Disc (PKR)</th>
                <th className="py-2.5 px-3 text-right">Line Total (PKR)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculatedItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <select
                      value={item.productId}
                      onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-medium"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.category}]
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={items[idx].batchNumber}
                      onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                      className="w-28 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="date"
                      value={items[idx].expiryDate}
                      onChange={e => handleItemChange(idx, 'expiryDate', e.target.value)}
                      className="w-32 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono"
                    />
                  </td>
                  <td className="py-2 px-3 text-center text-slate-600 font-semibold">{item.unit}</td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="1"
                      value={items[idx].quantity}
                      onChange={e => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-right font-mono font-bold"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={items[idx].purchasePrice}
                      onChange={e => handleItemChange(idx, 'purchasePrice', Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-right font-mono"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={items[idx].discount}
                      onChange={e => handleItemChange(idx, 'discount', Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-right font-mono"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                    {formatPKR(item.lineTotal)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Totals & Settlement */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Consignment Freight / Unloading Charges (PKR)</label>
              <input
                type="number"
                min="0"
                value={additionalCharges}
                onChange={e => setAdditionalCharges(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Immediate Cash / Bank Advance Paid (PKR)</label>
              <input
                type="number"
                min="0"
                max={grandTotal}
                value={amountPaidNow}
                onChange={e => setAmountPaidNow(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Consignment Remarks / Trailer #</label>
              <textarea
                rows={2}
                placeholder="e.g. Received at Tezab Mills Road Depot via Trailer # FSD-8821"
                value={purchaseNotes}
                onChange={e => setPurchaseNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between">
              <span>Lines Subtotal:</span>
              <span className="font-semibold text-slate-900 font-mono">{formatPKR(subtotal)}</span>
            </div>
            {additionalCharges > 0 && (
              <div className="flex justify-between">
                <span>Additional Charges:</span>
                <span className="font-mono">+{formatPKR(additionalCharges)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Invoice Grand Total:</span>
              <span className="text-emerald-700 font-mono">{formatPKR(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium pt-1">
              <span>Amount Paid Now:</span>
              <span className="font-mono font-bold">{formatPKR(amountPaidNow)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-800">Remaining Payable Added to Supplier:</span>
              <span className="font-bold text-rose-600 font-mono">{formatPKR(remainingPayable)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
