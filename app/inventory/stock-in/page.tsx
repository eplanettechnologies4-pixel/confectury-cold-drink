'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, CheckCircle2, PackageCheck, Building, FileText, Calendar } from 'lucide-react';
import { useAppState } from '@/lib/store';

export default function StockInPage() {
  const router = useRouter();
  const { products, recordStockMovement } = useAppState();

  const [supplier, setSupplier] = useState('Beverage Bottlers Corp');
  const [invoiceNumber, setInvoiceNumber] = useState(`PO-${Math.floor(90000 + Math.random() * 9000)}`);
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [warehouse, setWarehouse] = useState('Main Central Hub - Bay 4');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([
    { productId: products[0]?.id || '', quantity: 100, unitCost: products[0]?.costPrice || 14.50 },
  ]);

  const handleAddItem = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 50, unitCost: products[0].costPrice }]);
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
        unitCost: prod?.costPrice || 10,
      };
    } else {
      updated[index] = { ...updated[index], [field]: val };
    }
    setItems(updated);
  };

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    items.forEach(item => {
      if (item.productId && item.quantity > 0) {
        recordStockMovement(
          item.productId,
          'Stock In',
          item.quantity,
          invoiceNumber,
          notes || `Received PO shipment from ${supplier}`,
          supplier,
          warehouse
        );
      }
    });

    router.push('/inventory/history');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/inventory" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Receive Stock (Stock In)</h1>
            <p className="text-xs text-slate-500">Record incoming inventory shipments from suppliers.</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <PackageCheck className="h-4 w-4" />
          <span>Confirm & Receive Stock</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipment Metadata Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-erp p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
            <Building className="h-4 w-4 mr-2 text-emerald-600" /> Shipment Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier Name</label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier Invoice / PO #</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Received Date</label>
              <input
                type="date"
                value={receiveDate}
                onChange={e => setReceiveDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Destination Warehouse / Bay</label>
              <input
                type="text"
                value={warehouse}
                onChange={e => setWarehouse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes / GRN Remarks</label>
              <input
                type="text"
                placeholder="Inspected and verified batch"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Products Table Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-erp p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Received Product Line Items
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3 text-right">Quantity (Cases)</th>
                <th className="py-2.5 px-3 text-right">Unit Cost (Rs.)</th>
                <th className="py-2.5 px-3 text-right">Total (Rs.)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const selectedProd = products.find(p => p.id === item.productId);
                return (
                  <tr key={idx}>
                    <td className="py-2 px-3">
                      <select
                        value={item.productId}
                        onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-md font-medium"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.unit})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{selectedProd?.sku || '-'}</td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-right font-bold"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitCost}
                        onChange={e => handleItemChange(idx, 'unitCost', Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-right"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">Rs. {(item.quantity * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

          {/* Subtotal summary */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Shipment Subtotal:</span>
                <span className="font-semibold text-slate-900">Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Freight / Tax:</span>
                <span>Rs. {tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-emerald-600">Rs. {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
