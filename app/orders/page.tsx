'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Download, Eye, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Order } from '@/types';

export default function OrdersPage() {
  const router = useRouter();
  const { orders } = useAppState();

  const todayOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Draft').length;
  const confirmedOrders = orders.filter(o => o.status === 'Confirmed' || o.status === 'Delivered').length;
  const totalSalesVal = orders.reduce((acc, o) => acc + o.grandTotal, 0);

  const columns: Column<Order>[] = [
    {
      header: 'Order # & Date',
      accessorKey: 'orderNumber',
      cell: (o) => (
        <div>
          <Link href={`/orders/${o.id}`} className="font-bold text-brand-600 hover:underline block">
            {o.orderNumber}
          </Link>
          <span className="text-[11px] text-slate-500">{o.orderDate}</span>
        </div>
      ),
    },
    {
      header: 'Client & Company',
      cell: (o) => (
        <div>
          <span className="font-bold text-slate-900 block">{o.companyName}</span>
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
          <span className="font-extrabold text-slate-900 block">Rs. {o.grandTotal.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">Paid: Rs. ${o.amountPaid.toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'Payment Status',
      cell: (o) => <StatusBadge status={o.paymentStatus} />,
    },
    {
      header: 'Order Status',
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (o) => (
        <Link
          href={`/orders/${o.id}`}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View Invoice</span>
        </Link>
      ),
    },
  ];

  const handleExportCSV = () => {
    const headers = 'Order #,Date,Company,Salesperson,Grand Total (Rs.),Amount Paid (Rs.),Payment Status,Order Status\n';
    const rows = orders
      .map(o => `"Rs. {o.orderNumber}","Rs. {o.orderDate}","Rs. {o.companyName}","Rs. {o.salesperson}",${o.grandTotal},${o.amountPaid},"Rs. {o.paymentStatus}","Rs. {o.status}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Wholesale Sales & Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage wholesale orders, status fulfillment, and commercial invoices.
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
            <span> Create New Order</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Active Orders</span>
          <span className="text-xl font-extrabold text-slate-900">{orders.length} Orders</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Fulfillment</span>
          <span className="text-xl font-extrabold text-amber-600">{pendingOrders} Pending</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Confirmed & Delivered</span>
          <span className="text-xl font-extrabold text-emerald-600">{confirmedOrders} Orders</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Sales Revenue</span>
          <span className="text-xl font-extrabold text-brand-600">Rs. {totalSalesVal.toLocaleString()}</span>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search order #, client name, or salesperson..."
        searchField={(o) => `${o.orderNumber} ${o.companyName} ${o.clientName} ${o.salesperson}`}
        filters={[
          {
            key: 'status',
            label: 'Order Status',
            options: [
              { label: 'Draft', value: 'Draft' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Confirmed', value: 'Confirmed' },
              { label: 'Delivered', value: 'Delivered' },
              { label: 'Cancelled', value: 'Cancelled' },
            ],
          },
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
        addLabel="New Order"
      />
    </div>
  );
}
