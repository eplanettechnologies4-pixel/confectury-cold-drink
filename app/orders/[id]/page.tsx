'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, FileText, Store, MapPin, Phone, Receipt, RotateCcw, ChevronDown, CheckCircle, Package } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReturnModal } from '@/components/sales/ReturnModal';
import { formatPKR, formatDateDDMMYYYY, BUSINESS_CONFIG } from '@/lib/utils';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { orders, clients, salesReturns, updateOrderPaymentStatus } = useAppState();

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedProductIdForReturn, setSelectedProductIdForReturn] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const isPartiallyReturned = order.status === 'Partially Returned' || (order.returnedAmount !== undefined && order.returnedAmount > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold hover:underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          <Link href="/orders" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Invoice #{order.orderNumber}</span>
              {order.status === 'Partially Returned' && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Partially Returned
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500">
              Customer: {order.companyName} • {order.area} • Date: {formatDateDDMMYYYY(order.orderDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {order.status !== 'Returned' && (
            order.paymentStatus !== 'Paid' ? (
              <button
                onClick={() => updateOrderPaymentStatus(order.id, 'Paid')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                title="Mark this sale invoice as Paid"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark Paid</span>
              </button>
            ) : (
              <button
                onClick={() => updateOrderPaymentStatus(order.id, 'Unpaid')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg shadow-xs transition"
                title="Mark this sale invoice as Unpaid"
              >
                <span>Mark Unpaid</span>
              </button>
            )
          )}
          {order.status !== 'Returned' && (
            <button
              onClick={() => {
                setSelectedProductIdForReturn(undefined);
                setIsReturnModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg shadow-xs transition"
              title="Return individual products or entire sale"
            >
              <RotateCcw className="h-4 w-4 text-rose-600" />
              <span>Return Items / Sale</span>
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

      {isPartiallyReturned && order.status !== 'Returned' && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-amber-600 shrink-0" />
            <span>
              <strong>Partial Return Active:</strong> Some products have been returned from this sale ({formatPKR(order.returnedAmount || 0)} credit refunded). Kept products remain active on this invoice.
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedProductIdForReturn(undefined);
              setIsReturnModalOpen(true);
            }}
            className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold rounded text-[11px] shrink-0 ml-3"
          >
            Return More Items
          </button>
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
              <div className="relative inline-block print:hidden">
                <select
                  value={order.paymentStatus}
                  disabled={order.status === 'Returned'}
                  onChange={(e) => {
                    const newStatus = e.target.value as 'Paid' | 'Unpaid';
                    updateOrderPaymentStatus(order.id, newStatus);
                  }}
                  className={`appearance-none cursor-pointer pl-4 pr-6 py-0.5 text-xs font-semibold rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
                    order.paymentStatus === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 hover:border-emerald-400'
                      : order.paymentStatus === 'Partially Paid'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 hover:border-amber-400'
                      : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80 hover:border-rose-400'
                  }`}
                  title="Click to update payment status (Unpaid / Paid)"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  {order.paymentStatus === 'Partially Paid' && <option value="Partially Paid">Partially Paid</option>}
                </select>
                <span
                  className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${
                    order.paymentStatus === 'Paid'
                      ? 'bg-emerald-600'
                      : order.paymentStatus === 'Partially Paid'
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                  }`}
                />
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-current pointer-events-none opacity-60" />
              </div>
              <div className="hidden print:inline-block">
                <StatusBadge status={order.paymentStatus} />
              </div>
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
                {order.status !== 'Returned' && (
                  <th className="py-2.5 px-3 text-right print:hidden">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => {
                const itemReturnedQty = item.returnedQuantity !== undefined && item.returnedQuantity > 0
                  ? item.returnedQuantity
                  : salesReturns
                      .filter(sr => sr.orderId === order.id && sr.productId === item.productId)
                      .reduce((sum, sr) => sum + (sr.quantity || 0), 0);

                const keptQty = Math.max(0, item.quantity - itemReturnedQty);

                return (
                  <tr key={item.id || idx}>
                    <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {item.productName}
                      {item.sku && <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{item.category || 'General'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.unit}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span className="font-bold text-slate-900 block">{item.quantity}</span>
                      {itemReturnedQty > 0 && (
                        <div className="text-[10px] space-y-0.5 mt-0.5">
                          <span className="text-purple-700 font-semibold block">Returned: {itemReturnedQty}</span>
                          <span className="text-emerald-700 font-bold block">Kept: {keptQty}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-mono">{formatPKR(item.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-mono">{item.discountPercent}%</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatPKR(item.total)}
                      {itemReturnedQty > 0 && keptQty < item.quantity && (
                        <span className="block text-[10px] text-emerald-700 font-semibold">
                          Kept: {formatPKR(Math.round(keptQty * item.unitPrice * (1 - (item.discountPercent || 0) / 100)))}
                        </span>
                      )}
                    </td>
                    {order.status !== 'Returned' && (
                      <td className="py-2.5 px-3 text-right print:hidden">
                        {keptQty > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductIdForReturn(item.productId);
                              setIsReturnModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition shadow-2xs"
                            title={`Return units of ${item.productName}`}
                          >
                            <RotateCcw className="h-3 w-3 text-rose-600" />
                            <span>Return</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
                            Returned
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
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
            {order.returnedAmount !== undefined && order.returnedAmount > 0 && (
              <div className="flex justify-between text-purple-700 font-semibold border-t border-slate-200 pt-1.5">
                <span className="flex items-center">
                  <RotateCcw className="h-3 w-3 mr-1" /> Returned Items Credit:
                </span>
                <span className="font-mono">-{formatPKR(order.returnedAmount)}</span>
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

      {/* Return Sale & Items Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedProductIdForReturn(undefined);
        }}
        order={order}
        preSelectedProductId={selectedProductIdForReturn}
        onSuccess={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />
    </div>
  );
}
