'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, FileText, Store, MapPin, Phone, Receipt, RotateCcw } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { formatPKR, formatDateDDMMYYYY, BUSINESS_CONFIG } from '@/lib/utils';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { orders, clients, returnSale } = useAppState();

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Customer returned goods from route');
  const [isResalable, setIsResalable] = useState(true);

  const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
  const client = clients.find(c => c.id === order?.clientId);

  if (!order) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="text-base font-semibold">Sale invoice not found</p>
        <Link href="/orders" className="text-xs text-brand-600 hover:underline mt-2 inline-block">
          Back to sales list
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          <Link href="/orders" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoice #{order.orderNumber}</h1>
            <p className="text-xs text-slate-500">
              Customer: {order.companyName} • {order.area} • Date: {formatDateDDMMYYYY(order.orderDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {order.status !== 'Returned' && (
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <RotateCcw className="h-4 w-4 text-rose-600" />
              <span>Return Sale</span>
            </button>
          )}
          <Link
            href={`/orders/${order.id}/receipt`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Receipt className="h-4 w-4" />
            <span>Thermal Receipt</span>
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {order.status === 'Returned' && (
        <div className="p-4 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-center space-x-2 print:hidden">
          <RotateCcw className="h-5 w-5 text-purple-600 shrink-0" />
          <span>
            <strong>Sale Returned:</strong> This sale has been returned & refunded. It has been automatically removed from active Daily Sales.
          </span>
        </div>
      )}

      {/* Official Commercial Invoice Printable Document */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-erp print-card space-y-6">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{BUSINESS_CONFIG.name}</h2>
              <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">{BUSINESS_CONFIG.subtitle}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{BUSINESS_CONFIG.address}</p>
              <p className="text-[11px] text-slate-700 font-mono font-bold">
                Phone: {BUSINESS_CONFIG.phone1} • {BUSINESS_CONFIG.phone2}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded border border-emerald-200 uppercase tracking-wider">
              COMMERCIAL SALES INVOICE
            </span>
            <p className="text-lg font-black text-slate-900 font-mono">{order.orderNumber}</p>
            <p className="text-xs text-slate-500 font-mono">Date: {formatDateDDMMYYYY(order.orderDate)}</p>
            <div className="pt-1">
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>
        </div>

        {/* Billed To / Shipped To Grid */}
        <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To (Customer):</h4>
            <p className="font-extrabold text-slate-900 text-sm">{order.companyName}</p>
            <p className="text-slate-600 font-medium">Attn: {order.clientName}</p>
            <p className="text-slate-600">{client?.address?.address || 'Shop address on record'}</p>
            <p className="text-slate-700 font-semibold mt-1">Area: {order.area} • Category: {order.partyCategory || client?.partyCategory || 'B'}</p>
            <p className="text-slate-600 font-mono">Contact: {client?.phone || 'N/A'}</p>
          </div>

          <div className="text-right space-y-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Distribution Route & Terms:</h4>
            <p className="text-slate-700"><span className="text-slate-400">Route Salesperson:</span> <span className="font-semibold text-slate-900">{order.salesperson}</span></p>
            <p className="text-slate-700"><span className="text-slate-400">Payment Method:</span> <span className="font-semibold text-slate-900">{order.paymentMethod}</span></p>
            <p className="text-slate-700"><span className="text-slate-400">Delivery Status:</span> <span className="font-semibold text-slate-900">{order.status}</span></p>
            {client && (
              <p className="text-slate-700 pt-1">
                <span className="text-slate-400">Current Ledger Balance:</span>{' '}
                <span className="font-bold text-rose-600 font-mono">{formatPKR(client.currentBalance)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Product Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Packaging Unit</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Disc %</th>
                <th className="py-2.5 px-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {item.productName}
                    {item.sku && <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{item.category || 'General'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{item.unit}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-mono">{formatPKR(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500 font-mono">{item.discountPercent}%</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">{formatPKR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Footer */}
        <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-start">
          <div className="text-xs text-slate-500 space-y-1 max-w-sm">
            <p className="font-bold text-slate-800">Ahmad Traders Payment Information:</p>
            <p>Warehouse Depot: Khuram Chowk, Tezab Mills Road, Faisalabad</p>
            <p>Cash Collection / Delivery Receipt Reference: {order.orderNumber}</p>
            <p className="italic pt-2 text-slate-600">
              Thank you for doing business with Ahmad Traders. All disputes subject to Faisalabad jurisdiction.
            </p>
          </div>

          <div className="w-72 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-slate-900 font-mono">{formatPKR(order.subtotal)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Total Discount:</span>
                <span className="font-mono">-{formatPKR(order.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Net Total Amount:</span>
              <span className="text-emerald-700 font-mono">{formatPKR(order.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Amount Paid (Cash):</span>
              <span className="font-mono font-bold">{formatPKR(order.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-800">Remaining Credit Added to Balance:</span>
              <span className="font-bold text-rose-600 font-mono">{formatPKR(order.amountRemaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Return Sale Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title={`Return Sale Invoice #${order.orderNumber}`}
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              returnSale(order.id, {
                reason: returnReason,
                isResalable,
              });
              setIsReturnModalOpen(false);
              router.push('/orders');
            } catch (err: any) {
              alert(err?.message || 'Error returning sale');
            }
          }}
          className="space-y-4 text-xs"
        >
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
            <p className="font-bold flex items-center">
              <RotateCcw className="h-4 w-4 mr-1.5 text-amber-700" />
              Confirm Return for #{order.orderNumber}
            </p>
            <p className="text-[11px] text-amber-800 mt-1">
              Returning this sale will restock all inventory items, reverse customer balance, and <strong>automatically remove this invoice from Daily Sales</strong>.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Stock Condition *</label>
            <select
              value={isResalable ? 'true' : 'false'}
              onChange={(e) => setIsResalable(e.target.value === 'true')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            >
              <option value="true">Saleable (Add back to Active Stock)</option>
              <option value="false">Damaged / Broken (Record in Damage Loss)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Return Reason *</label>
            <input
              type="text"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Excess stock returned, route delivery rejected"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs flex items-center space-x-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Confirm & Return to Stock</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
