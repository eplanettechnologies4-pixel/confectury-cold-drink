'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, FileText, Store, MapPin, Phone, Receipt } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatPKR, formatDateDDMMYYYY, BUSINESS_CONFIG } from '@/lib/utils';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { orders, clients } = useAppState();

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
    </div>
  );
}
