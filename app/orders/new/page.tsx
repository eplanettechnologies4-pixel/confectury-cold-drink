'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Building,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { OrderItem, OrderStatus, PaymentMethod } from '@/types';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';

interface RawOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clients, products, createOrder, currentUser } = useAppState();

  const preselectedClientId = searchParams.get('clientId') || (clients[0]?.id ?? '');

  const [selectedClientId, setSelectedClientId] = useState<string>(preselectedClientId);
  const [salesperson, setSalesperson] = useState<string>('Hamza Farooq');
  const [orderDate, setOrderDate] = useState<string>(getTodayKarachiDate());
  const [paymentMethod, setPaymentMethod] = useState<any>('Credit Account');
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [items, setItems] = useState<RawOrderItem[]>(() => {
    if (products.length === 0) return [];
    return [
      {
        productId: products[0]?.id || '',
        quantity: 1,
        unitPrice: products[0]?.sellingPrice || 0,
        discountPercent: 0,
      },
    ];
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  useEffect(() => {
    if (selectedClient?.salesRep) {
      setSalesperson(selectedClient.salesRep);
    }
  }, [selectedClient]);

  const handleAddItem = () => {
    const firstAvailable = products.find(p => p.currentStock > 0) || products[0];
    if (firstAvailable) {
      setItems(prev => [
        ...prev,
        {
          productId: firstAvailable.id,
          quantity: 1,
          unitPrice: firstAvailable.sellingPrice,
          discountPercent: 0,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      updated[index] = {
        ...updated[index],
        productId: val,
        unitPrice: prod?.sellingPrice || 0,
      };
    } else {
      updated[index] = { ...updated[index], [field]: val };
    }
    setItems(updated);
  };

  // Financial Calculations
  const calculatedItems: OrderItem[] = items.map((item, idx) => {
    const prod = products.find(p => p.id === item.productId);
    const lineGross = item.quantity * item.unitPrice;
    const discountAmount = lineGross * (item.discountPercent / 100);
    const lineTotal = lineGross - discountAmount;

    return {
      id: 'item-' + idx,
      productId: item.productId,
      productName: prod?.name || 'Selected Product',
      sku: prod?.sku || 'SKU-000',
      category: prod?.category,
      batch: prod?.batchNumber,
      unit: prod?.unit || 'Carton',
      quantity: item.quantity,
      availableStock: prod?.currentStock || 0,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      discountAmount,
      total: lineTotal,
    };
  });

  const subtotal = calculatedItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const discountTotal = calculatedItems.reduce((acc, i) => acc + i.discountAmount, 0);
  const taxAmount = 0; // Distribution invoices standard
  const grandTotal = subtotal - discountTotal;
  const remainingCredit = Math.max(0, grandTotal - amountPaidNow);

  let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
  if (amountPaidNow >= grandTotal && grandTotal > 0) paymentStatus = 'Paid';
  else if (amountPaidNow > 0) paymentStatus = 'Partially Paid';

  // Check for insufficient stock across any line
  const stockErrors: string[] = [];
  calculatedItems.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod && item.quantity > prod.currentStock) {
      stockErrors.push(`"${prod.name}": Available ${prod.currentStock}, requested ${item.quantity}`);
    }
  });

  const handleCreateOrder = (status: OrderStatus = 'Posted') => {
    setErrorMessage('');
    if (!selectedClient) {
      setErrorMessage('Please select a customer.');
      return;
    }
    if (calculatedItems.length === 0) {
      setErrorMessage('Please add at least one product item.');
      return;
    }
    if (stockErrors.length > 0) {
      setErrorMessage(`Insufficient stock: ${stockErrors.join(' | ')}`);
      return;
    }

    setIsSubmitting(true);

    const res = createOrder({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      companyName: selectedClient.companyName,
      area: selectedClient.area,
      partyCategory: selectedClient.partyCategory,
      salesperson,
      orderDate,
      items: calculatedItems,
      subtotal,
      discountTotal,
      taxAmount: 0,
      grandTotal,
      amountPaid: amountPaidNow,
      amountRemaining: remainingCredit,
      status,
      paymentMethod,
      paymentStatus,
      notes: orderNotes,
    });

    setIsSubmitting(false);

    if (!res.success || !res.order) {
      setErrorMessage(res.error || 'Failed to record wholesale sale invoice.');
      return;
    }

    router.push(`/orders/${res.order.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/orders" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Wholesale Sale Invoice</h1>
            <p className="text-xs text-slate-500">Party-wise distribution order entry with live stock and credit check</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleCreateOrder('Draft')}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleCreateOrder('Posted')}
            disabled={isSubmitting || stockErrors.length > 0}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Post Sale Invoice</span>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Empty State Warning Banners */}
      {products.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span><strong>Product Catalog is Empty:</strong> You must add confectionery or cold drinks products before creating sales orders.</span>
          </div>
          <Link href="/inventory/products" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0">
            + Add Products
          </Link>
        </div>
      )}

      {clients.length === 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
            <span><strong>No Customers Registered:</strong> Please register a customer/party in Faisalabad routes first.</span>
          </div>
          <Link href="/clients/new" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shrink-0">
            + Add Customer
          </Link>
        </div>
      )}

      {/* Section 1: Customer Selection & Live Credit Information */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-erp p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
          <Building className="h-4 w-4 mr-2 text-brand-600" /> 1. Customer & Distribution Route
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Customer / Party *</label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:bg-white"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.name}) - {c.area} [Cat {c.partyCategory}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Salesperson / Route Rep</label>
            <input
              type="text"
              value={salesperson}
              onChange={e => setSalesperson(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Invoice Date</label>
            <input
              type="date"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
            />
          </div>
        </div>

        {/* Live Client Information Bar */}
        {selectedClient && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer & Owner</span>
              <span className="font-semibold text-slate-800">{selectedClient.companyName}</span>
              <span className="text-[11px] text-slate-500 block">{selectedClient.name} ({selectedClient.phone})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Area</span>
              <span className="font-bold text-slate-900">{selectedClient.area}</span>
              <span className="text-[10px] text-slate-500 block">Faisalabad Route</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Party Category</span>
              <span className={`inline-block px-2 py-0.5 mt-0.5 rounded text-[11px] font-bold ${
                selectedClient.partyCategory === 'A'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : selectedClient.partyCategory === 'B'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-slate-200 text-slate-700 border border-slate-300'
              }`}>
                Category {selectedClient.partyCategory} ({selectedClient.partyCategory === 'A' ? 'High' : selectedClient.partyCategory === 'B' ? 'Medium' : 'Low'})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Outstanding</span>
              <span className={`font-bold font-mono text-sm block ${
                selectedClient.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {formatPKR(selectedClient.currentBalance)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Approved Credit Limit</span>
              <span className="font-bold font-mono text-slate-800 block">{formatPKR(selectedClient.creditLimit)}</span>
              <span className="text-[10px] text-slate-500 block">
                Available: {formatPKR(Math.max(0, selectedClient.creditLimit - selectedClient.currentBalance))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Product Line Items */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-erp p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            2. Products & Quantities
          </h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product Line</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
              <tr>
                <th className="py-2 px-3">Product Name</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3 text-center">Unit</th>
                <th className="py-2 px-3 text-right">In Stock</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Price (PKR)</th>
                <th className="py-2 px-3 text-right">Disc %</th>
                <th className="py-2 px-3 text-right">Total (PKR)</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculatedItems.map((item, idx) => {
                const prod = products.find(p => p.id === item.productId);
                const isOutOfStock = prod ? item.quantity > prod.currentStock : false;

                return (
                  <tr key={idx} className={`hover:bg-slate-50 ${isOutOfStock ? 'bg-amber-50/60' : ''}`}>
                    <td className="py-2 px-3">
                      <select
                        value={item.productId}
                        onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-medium"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.category}] - Stock: {p.currentStock} {p.unit}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.category === 'Confectionery'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {item.category || prod?.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600 font-medium">{item.unit}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      <span className={isOutOfStock ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                        {prod?.currentStock || 0}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="1"
                        value={items[idx].quantity}
                        onChange={e => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                        className={`w-20 px-2 py-1 bg-slate-50 border rounded text-right font-mono font-bold ${
                          isOutOfStock ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-300'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        value={items[idx].unitPrice}
                        onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                        className="w-24 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-right font-mono"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={items[idx].discountPercent}
                        onChange={e => handleItemChange(idx, 'discountPercent', Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-right font-mono"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatPKR(item.total)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 3: Payment & Summary */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-800">3. Payment Terms & Settlement</h4>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                <option value="Credit Account">Credit Account (Add to Customer Receivable)</option>
                <option value="Cash">Cash Sale (Full Cash on Delivery)</option>
                <option value="Partial Cash/Credit">Partial Cash & Partial Credit</option>
                <option value="Bank Transfer">Direct Bank Transfer</option>
                <option value="Cheque">Post-Dated Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Cash / Advance Amount Received (PKR)</label>
              <input
                type="number"
                min="0"
                max={grandTotal}
                value={amountPaidNow}
                onChange={e => setAmountPaidNow(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Any cash received will be credited directly, remaining amount will be added to the customer's market credit.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Order / Delivery Remarks</label>
              <textarea
                rows={2}
                placeholder="e.g. Deliver via Van 1 morning route."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-slate-900 font-mono">{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Discount Total:</span>
              <span className="font-mono">-{formatPKR(discountTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Net Sale Total:</span>
              <span className="text-brand-600 font-mono">{formatPKR(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium pt-1">
              <span>Cash / Payment Received:</span>
              <span className="font-mono font-bold">{formatPKR(amountPaidNow)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
              <span className="font-semibold text-slate-800">Remaining Credit Added to Receivable:</span>
              <span className="font-bold text-rose-600 font-mono">{formatPKR(remainingCredit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
