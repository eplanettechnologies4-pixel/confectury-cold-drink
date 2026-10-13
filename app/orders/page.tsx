'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Download, Eye, RotateCcw, AlertTriangle, CheckCircle, Package, ChevronDown } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Order } from '@/types';
import { formatPKR, formatDateDDMMYYYY } from '@/lib/utils';

export default function OrdersPage() {
  const router = useRouter();
  const { orders, returnSale, updateOrderPaymentStatus } = useAppState();

  const [viewFilter, setViewFilter] = useState<'Active' | 'Returned' | 'All'>('Active');
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('Customer returned goods / overstocked');
  const [isResalable, setIsResalable] = useState(true);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active sales (returned and cancelled sales are removed from daily active sales)
  const activeOrders = orders.filter(o => o.status !== 'Returned' && o.status !== 'Cancelled');
  const returnedOrders = orders.filter(o => o.status === 'Returned');
  const pendingOrders = activeOrders.filter(o => o.status === 'Pending' || o.status === 'Draft').length;
  const confirmedOrders = activeOrders.filter(o => o.status === 'Confirmed' || o.status === 'Delivered' || o.status === 'Posted').length;
  const totalSalesVal = activeOrders.reduce((acc, o) => acc + o.grandTotal, 0);

  // Displayed orders depending on view tab
  const displayedOrders = orders.filter(o => {
    if (viewFilter === 'Active') return o.status !== 'Returned' && o.status !== 'Cancelled';
    if (viewFilter === 'Returned') return o.status === 'Returned';
    return true; // All
  });

  const handleOpenReturnModal = (order: Order) => {
    setReturnModalOrder(order);
    setReturnReason('Customer returned goods from route');
    setIsResalable(true);
    setRefundAmount(order.grandTotal);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;

    try {
      returnSale(returnModalOrder.id, {
        reason: returnReason,
        isResalable,
        refundAmount,
      });

      const orderNum = returnModalOrder.orderNumber;
      setReturnModalOrder(null);
      setToastMessage(`Sale #${orderNum} was returned and automatically removed from Daily Sales.`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'Error processing sale return');
    }
  };

  const columns: Column<Order>[] = [
    {
      header: 'Order # & Date',
      accessorKey: 'orderNumber',
      cell: (o) => (
        <div>
          <Link href={`/orders/${o.id}`} className="font-bold text-brand-600 hover:underline block font-mono text-xs">
            {o.orderNumber}
          </Link>
          <span className="text-[11px] text-slate-500 font-mono">{formatDateDDMMYYYY(o.orderDate)}</span>
        </div>
      ),
    },
    {
      header: 'Client & Company',
      cell: (o) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{o.companyName}</span>
          <span className="text-[11px] text-slate-500">{o.clientName} • Rep: {o.salesperson}</span>
        </div>
      ),
    },
    {
      header: 'Items Count',
      cell: (o) => (
        <span className="text-xs font-semibold text-slate-700">
          {o.items.reduce((acc, i) => acc + i.quantity, 0)} cases ({o.items.length} SKUs)
        </span>
      ),
    },
    {
      header: 'Grand Total',
      cell: (o) => (
        <div className="text-xs">
          <span className="font-extrabold text-slate-900 block">{formatPKR(o.grandTotal)}</span>
          <span className="text-[10px] text-slate-500 font-mono">Paid: {formatPKR(o.amountPaid)}</span>
        </div>
      ),
    },
    {
      header: 'Payment Status',
      cell: (o) => (
        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
          <select
            value={o.paymentStatus}
            disabled={o.status === 'Returned'}
            onChange={(e) => {
              const newStatus = e.target.value as 'Paid' | 'Unpaid';
              updateOrderPaymentStatus(o.id, newStatus);
              setToastMessage(`Payment status for Order #${o.orderNumber} updated to ${newStatus}.`);
              setTimeout(() => setToastMessage(null), 4000);
            }}
            className={`appearance-none cursor-pointer pl-4 pr-6 py-0.5 text-xs font-semibold rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
              o.paymentStatus === 'Paid'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 hover:border-emerald-400'
                : o.paymentStatus === 'Partially Paid'
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 hover:border-amber-400'
                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80 hover:border-rose-400'
            }`}
            title="Click to update payment status (Unpaid / Paid)"
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            {o.paymentStatus === 'Partially Paid' && <option value="Partially Paid">Partially Paid</option>}
          </select>
          <span
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${
              o.paymentStatus === 'Paid'
                ? 'bg-emerald-600'
                : o.paymentStatus === 'Partially Paid'
                ? 'bg-amber-600'
                : 'bg-rose-600'
            }`}
          />
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-current pointer-events-none opacity-60" />
        </div>
      ),
    },
    {
      header: 'Order Status',
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (o) => (
        <div className="flex items-center justify-end space-x-1.5">
          <Link
            href={`/orders/${o.id}`}
            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </Link>

          {o.status !== 'Returned' && (
            <button
              onClick={() => handleOpenReturnModal(o)}
              title="Return this sale and remove from Daily Sales"
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded transition"
            >
              <RotateCcw className="h-3.5 w-3.5 text-rose-600" />
              <span>Return Sale</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleExportCSV = () => {
    const headers = 'Order #,Date,Company,Salesperson,Grand Total (Rs.),Amount Paid (Rs.),Payment Status,Order Status\n';
    const rows = displayedOrders
      .map(o => `"${o.orderNumber}","${o.orderDate}","${o.companyName}","${o.salesperson}",${o.grandTotal},${o.amountPaid},"${o.paymentStatus}","${o.status}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily_Sales_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
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
            <ShoppingCart className="h-5 w-5 mr-2 text-brand-600" /> Daily Wholesale Sales & Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active daily customer sales invoices. Returned sales are automatically removed from daily figures and restocked.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/orders/new"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Sale Invoice</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary KPI Cards (Active Daily Sales Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Daily Orders</span>
          <span className="text-xl font-extrabold text-slate-900">{activeOrders.length} Invoices</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Fulfillment</span>
          <span className="text-xl font-extrabold text-amber-600">{pendingOrders} Pending</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Confirmed & Delivered</span>
          <span className="text-xl font-extrabold text-emerald-600">{confirmedOrders} Invoices</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Daily Active Revenue</span>
          <span className="text-xl font-extrabold text-brand-600">{formatPKR(totalSalesVal)}</span>
        </div>
      </div>

      {/* View Filter Switcher Tabs */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => setViewFilter('Active')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              viewFilter === 'Active'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Active Daily Sales</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">
              {activeOrders.length}
            </span>
          </button>

          <button
            onClick={() => setViewFilter('Returned')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              viewFilter === 'Returned'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Returned Invoices</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px] font-mono">
              {returnedOrders.length}
            </span>
          </button>

          <button
            onClick={() => setViewFilter('All')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              viewFilter === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Records ({orders.length})</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          {viewFilter === 'Active'
            ? 'Returned sales are automatically hidden from Daily Sales'
            : viewFilter === 'Returned'
            ? 'Invoices that have been returned & refunded'
            : 'Complete historical orders archive'}
        </span>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={displayedOrders}
        searchPlaceholder="Search order #, client name, or salesperson..."
        searchField={(o) => `${o.orderNumber} ${o.companyName} ${o.clientName} ${o.salesperson}`}
        filters={[
          {
            key: 'paymentStatus',
            label: 'Payment Status',
            options: [
              { label: 'Paid', value: 'Paid' },
              { label: 'Partially Paid', value: 'Partially Paid' },
              { label: 'Unpaid', value: 'Unpaid' },
            ],
          },
        ]}
        onAddClick={() => router.push('/orders/new')}
        addLabel="New Sale"
      />

      {/* Return Sale Modal */}
      <Modal
        isOpen={!!returnModalOrder}
        onClose={() => setReturnModalOrder(null)}
        title={returnModalOrder ? `Return Sale Invoice #${returnModalOrder.orderNumber}` : 'Return Sale'}
        maxWidth="max-w-lg"
      >
        {returnModalOrder && (
          <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              <p className="font-bold flex items-center">
                <RotateCcw className="h-4 w-4 mr-1.5 text-amber-700" />
                Returning Sale #{returnModalOrder.orderNumber}
              </p>
              <p className="text-[11px] text-amber-800 mt-1">
                Customer: <strong>{returnModalOrder.companyName}</strong> • Items:{' '}
                <strong>{returnModalOrder.items.reduce((s, i) => s + i.quantity, 0)} cases</strong> • Total: <strong>{formatPKR(returnModalOrder.grandTotal)}</strong>
              </p>
              <p className="text-[11px] text-amber-700 mt-1 italic">
                This will restock the inventory, reverse the customer&apos;s credit/ledger balance, and <strong>automatically remove this sale from Daily Sales</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stock Condition *</label>
                <select
                  value={isResalable ? 'true' : 'false'}
                  onChange={(e) => setIsResalable(e.target.value === 'true')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="true">Saleable (Restock to Active Inventory)</option>
                  <option value="false">Damaged / Broken (Record as Loss)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Refund / Credit Amount (PKR) *</label>
                <input
                  type="number"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-rose-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Return *</label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Excess stock returned, route delivery rejected, defective packaging"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setReturnModalOrder(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs flex items-center space-x-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Confirm & Remove from Daily Sales</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
