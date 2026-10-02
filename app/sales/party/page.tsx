'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Calendar,
  Filter,
  Users,
  MapPin,
  Download,
  Eye,
  Store,
  Banknote,
  ArrowRight,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate, BUSINESS_CONFIG } from '@/lib/utils';
import { PartyCategory, ProductCategory } from '@/types';

export default function PartyWiseSalesReportPage() {
  const { orders, clients, areas, salesReturns, products } = useAppState();

  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>(getTodayKarachiDate());
  const [endDate, setEndDate] = useState<string>(getTodayKarachiDate());
  const [selectedCustomer, setSelectedCustomer] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | PartyCategory>('All');
  const [selectedProductCategory, setSelectedProductCategory] = useState<'All' | ProductCategory>('All');

  const isDateMatch = (dateStr: string) => {
    if (dateRange === 'all') return true;
    const today = getTodayKarachiDate();
    const target = new Date(dateStr);
    const now = new Date(today);

    if (dateRange === 'today') return dateStr === today;
    if (dateRange === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return dateStr === yesterday.toISOString().split('T')[0];
    }
    if (dateRange === 'week') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return target >= sevenDaysAgo && target <= now;
    }
    if (dateRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return target >= startOfMonth && target <= now;
    }
    if (dateRange === 'custom') {
      return dateStr >= startDate && dateStr <= endDate;
    }
    return true;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (!isDateMatch(o.orderDate)) return false;
      if (selectedCustomer !== 'All' && o.clientId !== selectedCustomer) return false;
      if (selectedArea !== 'All' && o.area !== selectedArea) return false;
      if (selectedCategory !== 'All' && o.partyCategory !== selectedCategory) return false;
      if (selectedProductCategory !== 'All') {
        const hasProd = o.items.some(item => {
          const p = products.find(prod => prod.id === item.productId);
          return (item.category || p?.category) === selectedProductCategory;
        });
        if (!hasProd) return false;
      }
      return true;
    });
  }, [orders, dateRange, startDate, endDate, selectedCustomer, selectedArea, selectedCategory, selectedProductCategory, products]);

  // Aggregate totals
  const totalGross = filteredOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + o.discountTotal, 0);
  const totalNet = filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalCash = filteredOrders.reduce((sum, o) => sum + o.amountPaid, 0);
  const totalCredit = filteredOrders.reduce((sum, o) => sum + o.amountRemaining, 0);

  // Associated returns
  const totalReturns = filteredOrders.reduce((sum, o) => {
    const rets = salesReturns.filter(r => r.orderId === o.id);
    return sum + rets.reduce((rSum, r) => rSum + r.refundAmount, 0);
  }, 0);

  const handleExportCSV = () => {
    const headers = 'Invoice,Date,Customer,Area,Category,Gross Sales,Discount,Returns,Net Sales,Cash Received,Credit Created\n';
    const rows = filteredOrders
      .map(o => {
        const rets = salesReturns.filter(r => r.orderId === o.id).reduce((s, r) => s + r.refundAmount, 0);
        return `"${o.orderNumber}","${o.orderDate}","${o.companyName}","${o.area}","${o.partyCategory || 'B'}",${o.subtotal},${o.discountTotal},${rets},${o.grandTotal},${o.amountPaid},${o.amountRemaining}`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ahmad_Traders_Party_Sales_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-brand-600" /> Party-wise Daily Sales Report
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive audit of distribution sale invoices, customer categories, cash collected vs market credit created.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Download className="h-4 w-4" />
          <span>Export Report (CSV)</span>
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp space-y-3 text-xs">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Filter className="h-4 w-4 text-brand-600" />
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Report Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Date Period</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-medium"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Customer / Party</label>
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-medium"
            >
              <option value="All">All Customers ({clients.length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Area / Territory</label>
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-medium"
            >
              <option value="All">All Areas</option>
              {areas.map(a => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Party Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-medium"
            >
              <option value="All">All Categories</option>
              <option value="A">Category A (High)</option>
              <option value="B">Category B (Medium)</option>
              <option value="C">Category C (Low)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Product Category</label>
            <select
              value={selectedProductCategory}
              onChange={e => setSelectedProductCategory(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-medium"
            >
              <option value="All">All Products</option>
              <option value="Cold Drinks">Cold Drinks</option>
              <option value="Confectionery">Confectionery</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="col-span-2 flex space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Party-Wise Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-erp overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-200 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer / Party</th>
                <th className="py-3 px-3">Area</th>
                <th className="py-3 px-3 text-center">Category</th>
                <th className="py-3 px-3 text-right">Gross Sales</th>
                <th className="py-3 px-3 text-right">Discount</th>
                <th className="py-3 px-3 text-right">Returns</th>
                <th className="py-3 px-3 text-right">Net Sales</th>
                <th className="py-3 px-3 text-right">Cash Received</th>
                <th className="py-3 px-3 text-right">Credit Created</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                    No sales invoices found matching the selected report criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const rets = salesReturns
                    .filter(r => r.orderId === order.id)
                    .reduce((sum, r) => sum + r.refundAmount, 0);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatDateDDMMYYYY(order.orderDate)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{order.companyName}</span>
                        <span className="text-[10px] text-slate-500">{order.clientName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {order.area}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.partyCategory === 'A'
                              ? 'bg-purple-100 text-purple-700'
                              : order.partyCategory === 'B'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Cat {order.partyCategory || 'B'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatPKR(order.subtotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {order.discountTotal > 0 ? `-${formatPKR(order.discountTotal)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                        {rets > 0 ? formatPKR(rets) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatPKR(order.grandTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatPKR(order.amountPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        {formatPKR(order.amountRemaining)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Link
                          href={`/orders/${order.id}`}
                          className="p-1 text-slate-500 hover:text-brand-600 inline-block"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Report Totals Footer */}
            {filteredOrders.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                <tr>
                  <td colSpan={5} className="py-3 px-3 uppercase tracking-wider text-right font-black">
                    Grand Totals ({filteredOrders.length} Invoices):
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold">{formatPKR(totalGross)}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600 font-bold">-{formatPKR(totalDiscount)}</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-600 font-bold">{formatPKR(totalReturns)}</td>
                  <td className="py-3 px-3 text-right font-mono text-brand-700 font-black">{formatPKR(totalNet)}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700 font-black">{formatPKR(totalCash)}</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-700 font-black">{formatPKR(totalCredit)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
